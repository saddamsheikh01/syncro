package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.catalog.dto.AdminPlaceRequest;
import com.syncro.backend.domain.catalog.dto.AdminPlaceUpdateRequest;
import com.syncro.backend.domain.catalog.dto.PlaceDetailResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.entity.PlaceTag;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceTagRepository;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPlaceService {

    private final PlaceRepository placeRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceTagRepository placeTagRepository;
    private final TagRepository tagRepository;
    private final PlaceService placeService;

    public AdminPlaceService(
        PlaceRepository placeRepository,
        CategoryRepository categoryRepository,
        PlaceTagRepository placeTagRepository,
        TagRepository tagRepository,
        PlaceService placeService
    ) {
        this.placeRepository = placeRepository;
        this.categoryRepository = categoryRepository;
        this.placeTagRepository = placeTagRepository;
        this.tagRepository = tagRepository;
        this.placeService = placeService;
    }

    @Transactional(readOnly = true)
    public Page<PlaceSummaryResponse> getPlaces(
        AdminPrincipal principal,
        UUID categoryId,
        List<UUID> tagIds,
        List<String> googleTypes,
        Boolean openNow,
        Double minRating,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String query,
        CatalogSource source,
        int page,
        int size
    ) {
        ensureAdmin(principal);
        return placeService.getPlaces(
            categoryId,
            tagIds,
            googleTypes,
            openNow,
            minRating,
            latitude,
            longitude,
            radiusKm,
            query,
            source,
            page,
            size
        );
    }

    @Transactional(readOnly = true)
    public PlaceDetailResponse getPlace(AdminPrincipal principal, UUID placeId) {
        ensureAdmin(principal);
        return placeService.getPlace(placeId);
    }

    @Transactional
    public PlaceDetailResponse createPlace(AdminPrincipal principal, AdminPlaceRequest request) {
        ensureAdmin(principal);
        validateCoordinates(request.latitude(), request.longitude());
        Place place = new Place();
        place.setName(normalizeRequired(request.name()));
        place.setDescription(normalizeOptional(request.description()));
        place.setLatitude(request.latitude());
        place.setLongitude(request.longitude());
        place.setCategory(resolveCategory(request.categoryId()));
        place.setSource(resolveSource(request.source()));

        Place saved = placeRepository.save(place);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        return placeService.getPlace(saved.getId());
    }

    @Transactional
    public PlaceDetailResponse updatePlace(
        AdminPrincipal principal,
        UUID placeId,
        AdminPlaceUpdateRequest request
    ) {
        ensureAdmin(principal);
        if ((request.latitude() == null) != (request.longitude() == null)) {
            throw new BadRequestException("Latitudine e longitudine devono essere valorizzate insieme");
        }
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));

        if (request.name() != null) {
            place.setName(normalizeRequired(request.name()));
        }
        if (request.description() != null) {
            place.setDescription(normalizeOptional(request.description()));
        }
        if (request.latitude() != null && request.longitude() != null) {
            place.setLatitude(request.latitude());
            place.setLongitude(request.longitude());
        }
        if (request.categoryId() != null) {
            place.setCategory(resolveCategory(request.categoryId()));
        }
        if (request.source() != null) {
            place.setSource(request.source());
        }

        Place saved = placeRepository.save(place);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        return placeService.getPlace(saved.getId());
    }

    @Transactional
    public void deletePlace(AdminPrincipal principal, UUID placeId) {
        ensureAdmin(principal);
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
        placeRepository.delete(place);
    }

    private void replaceTags(Place place, List<UUID> tagIds) {
        placeTagRepository.deleteAllByPlaceId(place.getId());
        Set<UUID> uniqueIds = new LinkedHashSet<>(tagIds);
        if (uniqueIds.isEmpty()) {
            return;
        }
        List<Tag> tags = resolveTags(uniqueIds);
        List<PlaceTag> links = tags.stream()
            .map(tag -> buildPlaceTag(place, tag))
            .toList();
        placeTagRepository.saveAll(links);
    }

    private PlaceTag buildPlaceTag(Place place, Tag tag) {
        PlaceTag link = new PlaceTag();
        link.setPlace(place);
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

    private void validateCoordinates(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new BadRequestException("Latitudine e longitudine devono essere valorizzate insieme");
        }
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
}
