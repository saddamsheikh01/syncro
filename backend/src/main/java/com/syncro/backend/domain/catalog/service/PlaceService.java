package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceDetailResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.entity.PlaceTag;
import com.syncro.backend.domain.catalog.mapper.AffiliationLinkMapper;
import com.syncro.backend.domain.catalog.mapper.CategoryMapper;
import com.syncro.backend.domain.catalog.mapper.PlaceMapper;
import com.syncro.backend.domain.catalog.repository.AffiliationLinkRepository;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceTagRepository;
import com.syncro.backend.domain.external.googlemaps.GoogleMapsConfig;
import com.syncro.backend.domain.external.googlemaps.GoogleMapsSyncService;
import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.mapper.TagMapper;
import com.syncro.backend.domain.tags.repository.TagRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaceService {

    private static final Logger log = LoggerFactory.getLogger(PlaceService.class);
    private static final UUID DUMMY_TAG_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    // Configurazione auto-sync Google Maps
    private static final Duration SYNC_CACHE_TTL = Duration.ofHours(24);
    private static final double DEFAULT_SYNC_RADIUS_KM = 5.0;
    private static final int DEFAULT_SYNC_RADIUS_METERS = 5000;
    private static final int DEFAULT_SYNC_MAX_RESULTS = 20;
    private static final String DEFAULT_SYNC_TYPE = "point_of_interest";

    private final PlaceRepository placeRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceTagRepository placeTagRepository;
    private final TagRepository tagRepository;
    private final AffiliationLinkRepository affiliationLinkRepository;
    private final PlaceMapper placeMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final AffiliationLinkMapper affiliationLinkMapper;
    private final GoogleMapsSyncService googleMapsSyncService;
    private final GoogleMapsConfig googleMapsConfig;

    public PlaceService(
        PlaceRepository placeRepository,
        CategoryRepository categoryRepository,
        PlaceTagRepository placeTagRepository,
        TagRepository tagRepository,
        AffiliationLinkRepository affiliationLinkRepository,
        PlaceMapper placeMapper,
        CategoryMapper categoryMapper,
        TagMapper tagMapper,
        AffiliationLinkMapper affiliationLinkMapper,
        GoogleMapsSyncService googleMapsSyncService,
        GoogleMapsConfig googleMapsConfig
    ) {
        this.placeRepository = placeRepository;
        this.categoryRepository = categoryRepository;
        this.placeTagRepository = placeTagRepository;
        this.tagRepository = tagRepository;
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.placeMapper = placeMapper;
        this.categoryMapper = categoryMapper;
        this.tagMapper = tagMapper;
        this.affiliationLinkMapper = affiliationLinkMapper;
        this.googleMapsSyncService = googleMapsSyncService;
        this.googleMapsConfig = googleMapsConfig;
    }

    @Transactional
    public Page<PlaceSummaryResponse> getPlaces(
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

        // Auto-sync da Google Maps se richiesto source=GOOGLE e coordinate presenti
        if (source == CatalogSource.GOOGLE && latitude != null && longitude != null) {
            autoSyncFromGoogleMapsIfNeeded(latitude, longitude, radiusKm);
        }

        String normalizedQuery = normalizeOptional(query);
        boolean tagFilter = tagIds != null && !tagIds.isEmpty();
        List<UUID> normalizedTags = normalizeTagIds(tagIds, tagFilter);
        String sourceValue = source != null ? source.name() : null;
        PageRequest pageable = PageRequest.of(page, size);
        Page<Place> places = placeRepository.searchPlaces(
            categoryId,
            normalizedTags,
            tagFilter,
            latitude,
            longitude,
            radiusKm,
            normalizedQuery,
            sourceValue,
            pageable
        );
        Map<UUID, CategoryResponse> categories = loadCategories(places.getContent());
        return places.map(place -> placeMapper.toSummaryResponse(
            place,
            mapCategory(categories, place.getCategory())
        ));
    }

    /**
     * Sincronizza automaticamente i luoghi da Google Maps se:
     * - La API key è configurata
     * - Non ci sono luoghi Google nell'area sincronizzati di recente
     */
    private void autoSyncFromGoogleMapsIfNeeded(Double latitude, Double longitude, Double radiusKm) {
        if (!googleMapsConfig.isConfigured()) {
            log.debug("Auto-sync Google Maps saltato: API key non configurata");
            return;
        }

        double searchRadiusKm = radiusKm != null ? radiusKm : DEFAULT_SYNC_RADIUS_KM;
        Instant syncThreshold = Instant.now().minus(SYNC_CACHE_TTL);

        long freshPlacesCount = placeRepository.countGooglePlacesInAreaSyncedAfter(
            latitude, longitude, searchRadiusKm, syncThreshold
        );

        if (freshPlacesCount > 0) {
            log.debug("Auto-sync Google Maps saltato: {} luoghi freschi nell'area", freshPlacesCount);
            return;
        }

        log.info("Auto-sync Google Maps: lat={}, lng={}, radiusKm={}", latitude, longitude, searchRadiusKm);

        int radiusMeters = radiusKm != null
            ? (int) (radiusKm * 1000)
            : DEFAULT_SYNC_RADIUS_METERS;

        try {
            GoogleMapsSyncService.SyncResult result = googleMapsSyncService.syncNearbyPlaces(
                latitude,
                longitude,
                radiusMeters,
                DEFAULT_SYNC_TYPE,
                DEFAULT_SYNC_MAX_RESULTS
            );
            log.info("Auto-sync completato: creati={}, aggiornati={}, errori={}",
                result.created(), result.updated(), result.errors());
        } catch (Exception e) {
            log.error("Errore durante auto-sync Google Maps: {}", e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public PlaceDetailResponse getPlace(UUID placeId) {
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
        CategoryResponse category = place.getCategory() != null
            ? categoryMapper.toResponse(place.getCategory())
            : null;
        List<TagResponse> tags = loadTags(placeId);
        List<AffiliationLinkResponse> affiliationLinks = affiliationLinkRepository.findAllByPlace_Id(placeId)
            .stream()
            .sorted(Comparator.comparing(link -> link.getCreatedAt()))
            .map(affiliationLinkMapper::toResponse)
            .toList();
        return placeMapper.toDetailResponse(place, category, tags, affiliationLinks);
    }

    private Map<UUID, CategoryResponse> loadCategories(List<Place> places) {
        Set<UUID> categoryIds = places.stream()
            .map(Place::getCategory)
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

    private CategoryResponse mapCategory(Map<UUID, CategoryResponse> categories, Category category) {
        if (category == null) {
            return null;
        }
        return categories.get(category.getId());
    }

    private List<TagResponse> loadTags(UUID placeId) {
        List<PlaceTag> placeTags = placeTagRepository.findAllByPlaceId(placeId);
        if (placeTags.isEmpty()) {
            return List.of();
        }
        List<UUID> tagIds = placeTags.stream()
            .map(PlaceTag::getTagId)
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
