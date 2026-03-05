package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceReferenceResponse;
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
import com.syncro.backend.domain.external.viator.ViatorSyncService;
import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.mapper.TagMapper;
import com.syncro.backend.domain.tags.repository.TagRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.i18n.LocaleContextHolder;

@Service
public class ExperienceService {

    private static final UUID DUMMY_TAG_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");
    private static final String DUMMY_LOCATION_REF = "__NO_LOCATION_REF__";
    /** Default radius when lat/lng provided but radiusKm null (e.g. Viator fallback to DB by distance). */
    private static final double DEFAULT_NEARBY_RADIUS_KM = 150.0;

    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceTagRepository experienceTagRepository;
    private final TagRepository tagRepository;
    private final AffiliationLinkRepository affiliationLinkRepository;
    private final ViatorSyncService viatorSyncService;
    private final ExperienceMapper experienceMapper;
    private final CategoryMapper categoryMapper;
    private final PlaceMapper placeMapper;
    private final TagMapper tagMapper;
    private final AffiliationLinkMapper affiliationLinkMapper;

    public ExperienceService(
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        PlaceRepository placeRepository,
        ExperienceTagRepository experienceTagRepository,
        TagRepository tagRepository,
        AffiliationLinkRepository affiliationLinkRepository,
        ViatorSyncService viatorSyncService,
        ExperienceMapper experienceMapper,
        CategoryMapper categoryMapper,
        PlaceMapper placeMapper,
        TagMapper tagMapper,
        AffiliationLinkMapper affiliationLinkMapper
    ) {
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.placeRepository = placeRepository;
        this.experienceTagRepository = experienceTagRepository;
        this.tagRepository = tagRepository;
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.viatorSyncService = viatorSyncService;
        this.experienceMapper = experienceMapper;
        this.categoryMapper = categoryMapper;
        this.placeMapper = placeMapper;
        this.tagMapper = tagMapper;
        this.affiliationLinkMapper = affiliationLinkMapper;
    }

    @Transactional(readOnly = true)
    public Page<ExperienceSummaryResponse> getExperiences(
        UUID categoryId,
        List<UUID> tagIds,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String query,
        CatalogSource source,
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

        if (source == CatalogSource.VIATOR && latitude != null && longitude != null) {
            String localeTag = resolveLocaleTag();
            ViatorSyncService.NearbySyncResult nearbySyncResult = viatorSyncService.syncNearbyForCoordinates(
                latitude,
                longitude,
                localeTag
            );
            if (!nearbySyncResult.destinationRefs().isEmpty()) {
                locationRefs = normalizeLocationRefs(nearbySyncResult.destinationRefs());
                locationRefFilter = !locationRefs.isEmpty();
                effectiveLatitude = null;
                effectiveLongitude = null;
                effectiveRadiusKm = null;
            } else if (effectiveRadiusKm == null) {
                effectiveRadiusKm = DEFAULT_NEARBY_RADIUS_KM;
            }
        }

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
            pageable
        );
        Map<UUID, CategoryResponse> categories = loadCategories(experiences.getContent());
        Map<UUID, PlaceReferenceResponse> places = loadPlaces(experiences.getContent());
        return experiences.map(experience -> experienceMapper.toSummaryResponse(
            experience,
            mapCategory(categories, experience.getCategory()),
            mapPlace(places, experience.getPlace())
        ));
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperience(UUID experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));
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

    private List<String> normalizeLocationRefs(List<String> refs) {
        if (refs == null || refs.isEmpty()) {
            return List.of();
        }
        List<String> normalized = refs.stream()
            .map(this::normalizeOptional)
            .filter(value -> value != null)
            .distinct()
            .toList();
        if (normalized.isEmpty()) {
            return List.of();
        }
        return normalized;
    }

    private String resolveLocaleTag() {
        return normalizeOptional(LocaleContextHolder.getLocale().toLanguageTag());
    }
}
