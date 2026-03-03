package com.syncro.backend.domain.catalog.dto;

import java.util.List;

/**
 * Unified catalog response: places and experiences in one API call.
 * Used when the client requests "All" (places + experiences).
 */
public record CatalogResponse(
    List<PlaceSummaryResponse> places,
    long placesTotalElements,
    int placesTotalPages,
    int placesPage,
    int placesSize,
    List<ExperienceSummaryResponse> experiences,
    long experiencesTotalElements,
    int experiencesTotalPages,
    int experiencesPage,
    int experiencesSize
) {
}
