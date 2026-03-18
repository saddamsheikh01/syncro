package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.GetExperiencesResult;
import com.syncro.backend.domain.catalog.dto.JobAcceptedResponse;
import com.syncro.backend.domain.catalog.dto.PlaceReferenceResponse;
import com.syncro.backend.domain.catalog.entity.ViatorExperienceCache;
import com.syncro.backend.domain.catalog.entity.ViatorFetchJob;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.ExperienceTag;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.mapper.AffiliationLinkMapper;
import com.syncro.backend.domain.catalog.mapper.CategoryMapper;
import com.syncro.backend.domain.catalog.mapper.ExperienceMapper;
import com.syncro.backend.domain.catalog.mapper.PlaceMapper;
import com.syncro.backend.domain.catalog.repository.AffiliationLinkRepository;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceTagRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.ViatorFetchJobRepository;
import com.syncro.backend.domain.external.viator.ViatorClient;
import com.syncro.backend.domain.external.viator.ViatorProductMapper;
import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.mapper.TagMapper;
import com.syncro.backend.domain.tags.repository.TagRepository;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExperienceService {

    private static final Logger log = LoggerFactory.getLogger(ExperienceService.class);

    private static final UUID DUMMY_TAG_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String DUMMY_LOCATION_REF = "__NO_LOCATION_REF__";
    /** Default radius when lat/lng provided but radiusKm null (e.g. Viator fallback to DB by distance). */
    private static final double DEFAULT_NEARBY_RADIUS_KM = 100.0;

    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceTagRepository experienceTagRepository;
    private final TagRepository tagRepository;
    private final AffiliationLinkRepository affiliationLinkRepository;
    private final ViatorClient viatorClient;
    private final ViatorProductMapper viatorProductMapper;
    private final ExperienceMapper experienceMapper;
    private final CategoryMapper categoryMapper;
    private final PlaceMapper placeMapper;
    private final TagMapper tagMapper;
    private final AffiliationLinkMapper affiliationLinkMapper;
    private final ViatorExperienceCacheService viatorExperienceCacheService;
    private final ViatorFetchJobRepository viatorFetchJobRepository;

    public ExperienceService(
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        PlaceRepository placeRepository,
        ExperienceTagRepository experienceTagRepository,
        TagRepository tagRepository,
        AffiliationLinkRepository affiliationLinkRepository,
        ViatorClient viatorClient,
        ViatorProductMapper viatorProductMapper,
        ExperienceMapper experienceMapper,
        CategoryMapper categoryMapper,
        PlaceMapper placeMapper,
        TagMapper tagMapper,
        AffiliationLinkMapper affiliationLinkMapper,
        ViatorExperienceCacheService viatorExperienceCacheService,
        ViatorFetchJobRepository viatorFetchJobRepository
    ) {
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.placeRepository = placeRepository;
        this.experienceTagRepository = experienceTagRepository;
        this.tagRepository = tagRepository;
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.viatorClient = viatorClient;
        this.viatorProductMapper = viatorProductMapper;
        this.experienceMapper = experienceMapper;
        this.categoryMapper = categoryMapper;
        this.placeMapper = placeMapper;
        this.tagMapper = tagMapper;
        this.affiliationLinkMapper = affiliationLinkMapper;
        this.viatorExperienceCacheService = viatorExperienceCacheService;
        this.viatorFetchJobRepository = viatorFetchJobRepository;
    }

    @Transactional(readOnly = true)
    public JobAcceptedResponse getJobStatus(UUID jobId) {
        return viatorFetchJobRepository.findById(jobId)
            .map(job -> {
                String message = job.getStatus();
                if (ViatorFetchJob.STATUS_FAILED.equals(job.getStatus()) && job.getLastError() != null) {
                    message = job.getLastError();
                }
                return new JobAcceptedResponse(job.getId(), job.getStatus(), message);
            })
            .orElse(new JobAcceptedResponse(jobId, "NOT_FOUND", "Job not found or no longer available"));
    }

    @Transactional(readOnly = true)
    public GetExperiencesResult getExperiences(
        UUID categoryId,
        List<UUID> tagIds,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String query,
        CatalogSource source,
        String requestLocale,
        int page,
        int size
    ) {
        validateCoordinates(latitude, longitude, radiusKm);
        String normalizedQuery = normalizeOptional(query);
        boolean tagFilter = tagIds != null && !tagIds.isEmpty();
        List<UUID> normalizedTags = normalizeTagIds(tagIds, tagFilter);
        String sourceValue = source != null ? source.name() : null;
        List<String> locationRefs = List.of(DUMMY_LOCATION_REF);
        boolean locationRefFilter = false;

        Double effectiveLatitude = latitude;
        Double effectiveLongitude = longitude;
        Double effectiveRadiusKm = radiusKm;

        if (source == CatalogSource.VIATOR && (normalizedQuery != null || (latitude != null && longitude != null))) {
            String locale = viatorExperienceCacheService.resolveLocale(requestLocale);
            String cacheKey;
            String jobType;
            Map<String, Object> jobParams = new LinkedHashMap<>();
            if (normalizedQuery != null) {
                cacheKey = viatorExperienceCacheService.buildCacheKeySearch(normalizedQuery, locale);
                jobType = ViatorFetchJob.JOB_TYPE_SEARCH;
                jobParams.put("q", normalizedQuery);
                jobParams.put("locale", locale);
            } else {
                cacheKey = viatorExperienceCacheService.buildCacheKeyNearby(latitude, longitude, locale);
                jobType = ViatorFetchJob.JOB_TYPE_NEARBY;
                jobParams.put("lat", latitude);
                jobParams.put("lng", longitude);
                if (radiusKm != null) {
                    jobParams.put("radiusKm", radiusKm);
                }
                jobParams.put("locale", locale);
            }

            Optional<ViatorExperienceCache> cacheOpt = viatorExperienceCacheService.findValidCache(cacheKey);
            if (cacheOpt.isPresent()) {
                Page<ExperienceSummaryResponse> pageFromCache = pageFromCacheIds(cacheOpt.get(), page, size);
                return new GetExperiencesResult.GetExperiencesData(pageFromCache);
            }

            Optional<ViatorFetchJob> existingJob = viatorExperienceCacheService.findExistingJob(cacheKey);
            if (existingJob.isPresent()) {
                ViatorFetchJob job = existingJob.get();
                log.info("[Viator] Returning 202 existing job jobId={} type={} cacheKey={}", job.getId(), jobType, cacheKey);
                return new GetExperiencesResult.GetExperiencesJobAccepted(
                    new JobAcceptedResponse(job.getId(), job.getStatus(), "Job already in progress")
                );
            }

            ViatorFetchJob newJob = viatorExperienceCacheService.createJob(cacheKey, jobType, locale, jobParams);
            log.info("[Viator] Created job jobId={} type={} cacheKey={} (worker picks up within ~5 s)", newJob.getId(), jobType, cacheKey);

            // Pre-create background jobs for all other locales immediately so the worker
            // can process all locales in parallel on the very first scheduler tick.
            for (String bgLocale : ViatorExperienceCacheService.NEARBY_LOCALES) {
                if (bgLocale.equals(locale)) continue;
                try {
                    String bgCacheKey = ViatorFetchJob.JOB_TYPE_NEARBY.equals(jobType)
                        ? viatorExperienceCacheService.buildCacheKeyNearby(latitude, longitude, bgLocale)
                        : viatorExperienceCacheService.buildCacheKeySearch(normalizedQuery, bgLocale);
                    if (viatorExperienceCacheService.findValidCache(bgCacheKey).isPresent()) continue;
                    if (viatorExperienceCacheService.findExistingJob(bgCacheKey).isPresent()) continue;
                    Map<String, Object> bgParams = new LinkedHashMap<>(jobParams);
                    bgParams.put("locale", bgLocale);
                    ViatorFetchJob bgJob = viatorExperienceCacheService.createJob(bgCacheKey, jobType, bgLocale, bgParams);
                    log.info("[Viator] Pre-created background job locale={} jobId={} cacheKey={}", bgLocale, bgJob.getId(), bgCacheKey);
                } catch (Exception e) {
                    log.warn("[Viator] Failed to pre-create background job locale={}: {}", bgLocale, e.getMessage());
                }
            }

            return new GetExperiencesResult.GetExperiencesJobAccepted(
                new JobAcceptedResponse(newJob.getId(), ViatorFetchJob.STATUS_PENDING, "Fetch started")
            );
        }

        if (latitude != null && longitude != null && effectiveRadiusKm == null) {
            effectiveRadiusKm = DEFAULT_NEARBY_RADIUS_KM;
        }

        String effectiveLocale = viatorExperienceCacheService.resolveLocale(requestLocale);
        PageRequest pageable = PageRequest.of(page, size);
        Page<Experience> experiences = experienceRepository.searchExperiences(
            categoryId,
            normalizedTags,
            tagFilter,
            effectiveLatitude,
            effectiveLongitude,
            effectiveRadiusKm,
            normalizedQuery,
            locationRefs,
            locationRefFilter,
            sourceValue,
            effectiveLocale,
            pageable
        );
        Map<UUID, CategoryResponse> categories = loadCategories(experiences.getContent());
        Map<UUID, PlaceReferenceResponse> places = loadPlaces(experiences.getContent());
        Page<ExperienceSummaryResponse> pageResponse = experiences.map(experience -> experienceMapper.toSummaryResponse(
            experience,
            mapCategory(categories, experience.getCategory()),
            mapPlace(places, experience.getPlace())
        ));
        return new GetExperiencesResult.GetExperiencesData(pageResponse);
    }

    private Page<ExperienceSummaryResponse> pageFromCacheIds(ViatorExperienceCache cache, int page, int size) {
        List<UUID> allIds = cache.getExperienceIds();
        int total = allIds.size();
        int start = Math.min(page * size, total);
        int end = Math.min(start + size, total);
        List<UUID> pageIds = start < end ? allIds.subList(start, end) : List.of();
        if (pageIds.isEmpty()) {
            return new PageImpl<>(List.of(), PageRequest.of(page, size), total);
        }
        List<Experience> list = experienceRepository.findAllById(pageIds);
        Map<UUID, Integer> order = new LinkedHashMap<>();
        for (int i = 0; i < pageIds.size(); i++) {
            order.put(pageIds.get(i), i);
        }
        list.sort(Comparator.comparing(e -> order.getOrDefault(e.getId(), Integer.MAX_VALUE)));
        Map<UUID, CategoryResponse> categories = loadCategories(list);
        Map<UUID, PlaceReferenceResponse> places = loadPlaces(list);
        List<ExperienceSummaryResponse> content = list.stream()
            .map(experience -> experienceMapper.toSummaryResponse(
                experience,
                mapCategory(categories, experience.getCategory()),
                mapPlace(places, experience.getPlace())
            ))
            .toList();
        return new PageImpl<>(content, PageRequest.of(page, size), total);
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperience(UUID experienceId) {
        return getExperience(experienceId.toString());
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperience(String idOrRef) {
        if (idOrRef != null && idOrRef.startsWith("viator-")) {
            String productCode = idOrRef.substring(7);
            if (productCode.isBlank()) {
                throw new NotFoundException("Experience not found");
            }
            String language = LocaleContextHolder.getLocale().toLanguageTag();
            List<com.fasterxml.jackson.databind.JsonNode> products = viatorClient.getProductsBulk(List.of(productCode), language);
            com.fasterxml.jackson.databind.JsonNode product = (products != null && !products.isEmpty())
                ? products.getFirst()
                : viatorClient.getProduct(productCode, language).orElse(null);
            if (product == null) {
                throw new NotFoundException("Experience not found");
            }
            return viatorProductMapper.toDetailResponse(product);
        }
        UUID experienceId;
        try {
            experienceId = UUID.fromString(idOrRef);
        } catch (IllegalArgumentException ex) {
            throw new NotFoundException("Experience not found");
        }
        return getExperienceById(experienceId);
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperienceById(UUID experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Experience not found"));
        CategoryResponse category = mapCategory(categoryMapper, experience.getCategory());
        PlaceReferenceResponse place = mapPlace(placeMapper, experience.getPlace());
        List<TagResponse> tags = loadTags(experienceId);
        List<AffiliationLinkResponse> affiliationLinks = affiliationLinkRepository.findAllByExperience_Id(experienceId)
            .stream()
            .sorted(Comparator.comparing(link -> link.getCreatedAt()))
            .map(affiliationLinkMapper::toResponse)
            .toList();
        return experienceMapper.toDetailResponse(experience, category, place, tags, affiliationLinks);
    }

    private Map<UUID, CategoryResponse> loadCategories(List<Experience> experiences) {
        Set<UUID> categoryIds = experiences.stream()
            .map(Experience::getCategory)
            .filter(category -> category != null)
            .map(Category::getId)
            .collect(Collectors.toSet());
        if (categoryIds.isEmpty()) {
            return Map.of();
        }
        return categoryRepository.findAllById(categoryIds)
            .stream()
            .map(categoryMapper::toResponse)
            .collect(Collectors.toMap(CategoryResponse::id, Function.identity()));
    }

    private Map<UUID, PlaceReferenceResponse> loadPlaces(List<Experience> experiences) {
        Set<UUID> placeIds = experiences.stream()
            .map(Experience::getPlace)
            .filter(place -> place != null)
            .map(Place::getId)
            .collect(Collectors.toSet());
        if (placeIds.isEmpty()) {
            return Map.of();
        }
        return placeRepository.findAllById(placeIds)
            .stream()
            .map(placeMapper::toReferenceResponse)
            .collect(Collectors.toMap(PlaceReferenceResponse::id, Function.identity()));
    }

    private CategoryResponse mapCategory(Map<UUID, CategoryResponse> categories, Category category) {
        if (category == null) {
            return null;
        }
        return categories.get(category.getId());
    }

    private CategoryResponse mapCategory(CategoryMapper mapper, Category category) {
        if (category == null) {
            return null;
        }
        return mapper.toResponse(category);
    }

    private PlaceReferenceResponse mapPlace(Map<UUID, PlaceReferenceResponse> places, Place place) {
        if (place == null) {
            return null;
        }
        return places.get(place.getId());
    }

    private PlaceReferenceResponse mapPlace(PlaceMapper mapper, Place place) {
        if (place == null) {
            return null;
        }
        return mapper.toReferenceResponse(place);
    }

    private List<TagResponse> loadTags(UUID experienceId) {
        List<ExperienceTag> experienceTags = experienceTagRepository.findAllByExperienceId(experienceId);
        if (experienceTags.isEmpty()) {
            return List.of();
        }
        List<UUID> tagIds = experienceTags.stream()
            .map(ExperienceTag::getTagId)
            .toList();
        List<Tag> tags = tagRepository.findAllById(tagIds);
        return tags.stream()
            .sorted(Comparator.comparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
            .map(tagMapper::toResponse)
            .toList();
    }

    private void validateCoordinates(Double latitude, Double longitude, Double radiusKm) {
        if ((latitude == null) != (longitude == null)) {
            throw new BadRequestException("Latitudine e longitudine devono essere valorizzate insieme");
        }
        if (radiusKm != null && (latitude == null || longitude == null)) {
            throw new BadRequestException("Raggio richiede coordinate valide");
        }
        if (radiusKm != null && radiusKm <= 0) {
            throw new BadRequestException("Raggio non valido");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private List<UUID> normalizeTagIds(List<UUID> ids, boolean tagFilter) {
        if (!tagFilter) {
            return List.of(DUMMY_TAG_ID);
        }
        return ids.stream().distinct().toList();
    }

}
