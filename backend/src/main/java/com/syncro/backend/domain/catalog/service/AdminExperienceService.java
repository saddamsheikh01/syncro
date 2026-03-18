package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.catalog.dto.AdminExperienceRequest;
import com.syncro.backend.domain.catalog.dto.AdminExperienceUpdateRequest;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.GetExperiencesResult;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.ExperienceTag;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceTagRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.ViatorExperienceCacheRepository;
import com.syncro.backend.domain.catalog.repository.ViatorFetchJobRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminExperienceService {

    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceTagRepository experienceTagRepository;
    private final TagRepository tagRepository;
    private final ExperienceService experienceService;
    private final EmailNotificationService emailNotificationService;
    private final UserProfileRepository userProfileRepository;
    private final ViatorExperienceCacheRepository viatorExperienceCacheRepository;
    private final ViatorFetchJobRepository viatorFetchJobRepository;

    public AdminExperienceService(
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        PlaceRepository placeRepository,
        ExperienceTagRepository experienceTagRepository,
        TagRepository tagRepository,
        ExperienceService experienceService,
        EmailNotificationService emailNotificationService,
        UserProfileRepository userProfileRepository,
        ViatorExperienceCacheRepository viatorExperienceCacheRepository,
        ViatorFetchJobRepository viatorFetchJobRepository
    ) {
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.placeRepository = placeRepository;
        this.experienceTagRepository = experienceTagRepository;
        this.tagRepository = tagRepository;
        this.experienceService = experienceService;
        this.emailNotificationService = emailNotificationService;
        this.userProfileRepository = userProfileRepository;
        this.viatorExperienceCacheRepository = viatorExperienceCacheRepository;
        this.viatorFetchJobRepository = viatorFetchJobRepository;
    }

    @Transactional(readOnly = true)
    public Page<ExperienceSummaryResponse> getExperiences(
        AdminPrincipal principal,
        UUID categoryId,
        List<UUID> tagIds,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String query,
        int page,
        int size
    ) {
        ensureAdmin(principal);
        var result = experienceService.getExperiences(
            categoryId,
            tagIds,
            latitude,
            longitude,
            radiusKm,
            query,
            null,
            null,
            page,
            size
        );
        if (result instanceof GetExperiencesResult.GetExperiencesData d) {
            return d.page();
        }
        return Page.empty(PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperience(AdminPrincipal principal, UUID experienceId) {
        ensureAdmin(principal);
        return experienceService.getExperience(experienceId);
    }

    @Transactional
    public ExperienceDetailResponse createExperience(AdminPrincipal principal, AdminExperienceRequest request) {
        ensureAdmin(principal);
        Experience experience = new Experience();
        experience.setName(normalizeRequired(request.name()));
        experience.setDescription(normalizeOptional(request.description()));
        experience.setCategory(resolveCategory(request.categoryId()));
        experience.setPlace(resolvePlace(request.placeId()));
        experience.setSource(resolveSource(request.source()));

        // Campi provider esterni
        experience.setProvider(normalizeOptional(request.provider()));
        experience.setExternalId(normalizeOptional(request.externalId()));
        experience.setPrice(request.price());
        experience.setPriceCurrency(request.priceCurrency() != null ? request.priceCurrency() : "EUR");
        experience.setOriginalPrice(request.originalPrice());
        experience.setDurationMinutes(request.durationMinutes());
        experience.setImageUrl(normalizeOptional(request.imageUrl()));
        experience.setImages(request.images());
        experience.setBookingUrl(normalizeOptional(request.bookingUrl()));
        experience.setRating(request.rating());
        experience.setReviewCount(request.reviewCount());
        experience.setLatitude(request.latitude());
        experience.setLongitude(request.longitude());
        experience.setLocationName(normalizeOptional(request.locationName()));
        experience.setHighlights(request.highlights());
        experience.setInclusions(request.inclusions());
        experience.setExclusions(request.exclusions());
        experience.setLanguages(request.languages());
        experience.setCancellationPolicy(normalizeOptional(request.cancellationPolicy()));
        experience.setMeetingPoint(normalizeOptional(request.meetingPoint()));
        experience.setMinParticipants(request.minParticipants());
        experience.setMaxParticipants(request.maxParticipants());
        experience.setIsActive(request.isActive() != null ? request.isActive() : true);

        Experience saved = experienceRepository.save(experience);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        notifyUsersNewEventNearby(saved);
        return experienceService.getExperience(saved.getId());
    }

    @Transactional
    public ExperienceDetailResponse updateExperience(
        AdminPrincipal principal,
        UUID experienceId,
        AdminExperienceUpdateRequest request
    ) {
        ensureAdmin(principal);
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));

        if (request.name() != null) {
            experience.setName(normalizeRequired(request.name()));
        }
        if (request.description() != null) {
            experience.setDescription(normalizeOptional(request.description()));
        }
        if (request.categoryId() != null) {
            experience.setCategory(resolveCategory(request.categoryId()));
        }
        if (request.placeId() != null) {
            experience.setPlace(resolvePlace(request.placeId()));
        }
        if (request.source() != null) {
            experience.setSource(request.source());
        }

        // Campi provider esterni
        if (request.provider() != null) {
            experience.setProvider(normalizeOptional(request.provider()));
        }
        if (request.externalId() != null) {
            experience.setExternalId(normalizeOptional(request.externalId()));
        }
        if (request.price() != null) {
            experience.setPrice(request.price());
        }
        if (request.priceCurrency() != null) {
            experience.setPriceCurrency(request.priceCurrency());
        }
        if (request.originalPrice() != null) {
            experience.setOriginalPrice(request.originalPrice());
        }
        if (request.durationMinutes() != null) {
            experience.setDurationMinutes(request.durationMinutes());
        }
        if (request.imageUrl() != null) {
            experience.setImageUrl(normalizeOptional(request.imageUrl()));
        }
        if (request.images() != null) {
            experience.setImages(request.images());
        }
        if (request.bookingUrl() != null) {
            experience.setBookingUrl(normalizeOptional(request.bookingUrl()));
        }
        if (request.rating() != null) {
            experience.setRating(request.rating());
        }
        if (request.reviewCount() != null) {
            experience.setReviewCount(request.reviewCount());
        }
        if (request.latitude() != null) {
            experience.setLatitude(request.latitude());
        }
        if (request.longitude() != null) {
            experience.setLongitude(request.longitude());
        }
        if (request.locationName() != null) {
            experience.setLocationName(normalizeOptional(request.locationName()));
        }
        if (request.highlights() != null) {
            experience.setHighlights(request.highlights());
        }
        if (request.inclusions() != null) {
            experience.setInclusions(request.inclusions());
        }
        if (request.exclusions() != null) {
            experience.setExclusions(request.exclusions());
        }
        if (request.languages() != null) {
            experience.setLanguages(request.languages());
        }
        if (request.cancellationPolicy() != null) {
            experience.setCancellationPolicy(normalizeOptional(request.cancellationPolicy()));
        }
        if (request.meetingPoint() != null) {
            experience.setMeetingPoint(normalizeOptional(request.meetingPoint()));
        }
        if (request.minParticipants() != null) {
            experience.setMinParticipants(request.minParticipants());
        }
        if (request.maxParticipants() != null) {
            experience.setMaxParticipants(request.maxParticipants());
        }
        if (request.isActive() != null) {
            experience.setIsActive(request.isActive());
        }

        Experience saved = experienceRepository.save(experience);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        notifyUsersNewEventNearby(saved);
        return experienceService.getExperience(saved.getId());
    }

    private void notifyUsersNewEventNearby(Experience experience) {
        if (experience == null || !Boolean.TRUE.equals(experience.getIsActive())) return;
        String city = null;
        if (experience.getPlace() != null && experience.getPlace().getCity() != null && !experience.getPlace().getCity().isBlank()) {
            city = experience.getPlace().getCity();
        }
        if ((city == null || city.isBlank()) && experience.getLocationName() != null && !experience.getLocationName().isBlank()) {
            city = experience.getLocationName();
        }
        if (city == null || city.isBlank()) return;
        String eventTitle = experience.getName() != null ? experience.getName() : "New experience";
        UUID eventId = experience.getId();
        for (UserProfile profile : userProfileRepository.findByCityIgnoreCase(city)) {
            UUID userId = profile.getUser() != null ? profile.getUser().getId() : null;
            if (userId == null) continue;
            try {
                emailNotificationService.sendNewEventNearby(userId, eventTitle, city, eventId);
            } catch (Exception ignored) {
                // best-effort per user
            }
        }
    }

    @Transactional
    public void deleteExperience(AdminPrincipal principal, UUID experienceId) {
        ensureAdmin(principal);
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));
        experienceRepository.delete(experience);
    }

    private void replaceTags(Experience experience, List<UUID> tagIds) {
        experienceTagRepository.deleteAllByExperienceId(experience.getId());
        Set<UUID> uniqueIds = new LinkedHashSet<>(tagIds);
        if (uniqueIds.isEmpty()) {
            return;
        }
        List<Tag> tags = resolveTags(uniqueIds);
        List<ExperienceTag> links = tags.stream()
            .map(tag -> buildExperienceTag(experience, tag))
            .toList();
        experienceTagRepository.saveAll(links);
    }

    private ExperienceTag buildExperienceTag(Experience experience, Tag tag) {
        ExperienceTag link = new ExperienceTag();
        link.setExperience(experience);
        link.setTag(tag);
        return link;
    }

    private Category resolveCategory(UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria non trovata"));
    }

    private Place resolvePlace(UUID placeId) {
        if (placeId == null) {
            return null;
        }
        return placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
    }

    private List<Tag> resolveTags(Set<UUID> tagIds) {
        List<Tag> tags = tagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
            Set<UUID> missing = new LinkedHashSet<>(tagIds);
            Set<UUID> found = tags.stream().map(Tag::getId).collect(Collectors.toSet());
            missing.removeAll(found);
            throw new NotFoundException("Tag non trovati: " + missing);
        }
        return tags;
    }

    private CatalogSource resolveSource(CatalogSource source) {
        return source != null ? source : CatalogSource.MANUAL;
    }

    private void ensureAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        AdminRole role = AdminRole.valueOf(principal.role());
        if (role != AdminRole.ADMIN && role != AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private String normalizeRequired(String value) {
        if (value == null) {
            throw new BadRequestException("Valore non valido");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Valore non valido");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    /**
     * Clears Viator cache entries (and their completed/failed jobs) whose cache key starts with
     * the given prefix. Useful when a location resolved to the wrong destination and produced
     * empty results — clearing the cache lets the worker re-run with the corrected logic.
     *
     * @param principal admin user
     * @param prefix    cache key prefix, e.g. "nearby:45.61:13.83" or "nearby:" for all
     * @return number of cache rows deleted
     */
    @Transactional
    public int clearViatorCache(AdminPrincipal principal, String prefix) {
        ensureAdmin(principal);
        if (prefix == null || prefix.isBlank()) {
            throw new BadRequestException("Cache key prefix is required — pass a specific prefix (e.g. \"nearby:45.61:13.83\") to avoid wiping the entire cache");
        }
        String safePrefix = prefix.trim();
        int cacheDeleted = viatorExperienceCacheRepository.deleteByCacheKeyPrefix(safePrefix);
        viatorFetchJobRepository.deleteCompletedOrFailedByCacheKeyPrefix(safePrefix);
        return cacheDeleted;
    }
}
