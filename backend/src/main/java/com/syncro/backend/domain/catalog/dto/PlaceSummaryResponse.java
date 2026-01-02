package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.util.UUID;

public record PlaceSummaryResponse(
    UUID id,
    String name,
    String description,
    Double latitude,
    Double longitude,
    CategoryResponse category,
    CatalogSource source
) {
}
