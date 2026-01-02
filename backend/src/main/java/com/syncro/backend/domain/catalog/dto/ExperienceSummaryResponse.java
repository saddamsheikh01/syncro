package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.util.UUID;

public record ExperienceSummaryResponse(
    UUID id,
    String name,
    String description,
    CategoryResponse category,
    PlaceReferenceResponse place,
    CatalogSource source
) {
}
