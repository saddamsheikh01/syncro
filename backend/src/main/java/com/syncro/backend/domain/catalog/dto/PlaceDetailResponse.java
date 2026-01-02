package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.tags.dto.TagResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlaceDetailResponse(
    UUID id,
    String name,
    String description,
    Double latitude,
    Double longitude,
    CategoryResponse category,
    CatalogSource source,
    List<TagResponse> tags,
    List<AffiliationLinkResponse> affiliationLinks,
    Instant createdAt,
    Instant updatedAt
) {
}
