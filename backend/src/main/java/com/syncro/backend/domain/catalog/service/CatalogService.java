package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.domain.catalog.dto.CatalogResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.GetExperiencesResult;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Unified catalog: returns both places and experiences in one call.
 * Used when the client requests "All" (places + experiences) with a single API request.
 */
@Service
public class CatalogService {

    private final PlaceService placeService;
    private final ExperienceService experienceService;

    public CatalogService(PlaceService placeService, ExperienceService experienceService) {
        this.placeService = placeService;
        this.experienceService = experienceService;
    }

    @Transactional(readOnly = true)
    public CatalogResponse getCatalog(
        UUID categoryId,
        List<UUID> tagIds,
        List<String> googleTypes,
        Boolean openNow,
        Double minRating,
        Double lat,
        Double lng,
        Double radiusKm,
        String q,
        CatalogSource source,
        int page,
        int size
    ) {
        Page<PlaceSummaryResponse> placesPage = placeService.getPlaces(
            categoryId,
            tagIds,
            googleTypes,
            openNow,
            minRating,
            lat,
            lng,
            radiusKm,
            q,
            source,
            page,
            size
        );
        // Use Viator API for experiences when user has a search term or coordinates (same as Experiences tab).
        CatalogSource experienceSource = (q != null && !q.isBlank()) || (lat != null && lng != null)
            ? CatalogSource.VIATOR
            : source;
        GetExperiencesResult experiencesResult = experienceService.getExperiences(
            categoryId,
            tagIds,
            lat,
            lng,
            radiusKm,
            q,
            experienceSource,
            null,
            page,
            size
        );
        Page<ExperienceSummaryResponse> experiencesPage = experiencesResult instanceof GetExperiencesResult.GetExperiencesData d
            ? d.page()
            : Page.empty(PageRequest.of(page, size));

        return new CatalogResponse(
            placesPage.getContent(),
            placesPage.getTotalElements(),
            placesPage.getTotalPages(),
            placesPage.getNumber(),
            placesPage.getSize(),
            experiencesPage.getContent(),
            experiencesPage.getTotalElements(),
            experiencesPage.getTotalPages(),
            experiencesPage.getNumber(),
            experiencesPage.getSize()
        );
    }
}
