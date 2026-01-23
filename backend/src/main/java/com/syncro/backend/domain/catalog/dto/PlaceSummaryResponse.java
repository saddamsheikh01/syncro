package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.math.BigDecimal;
import java.util.UUID;

public record PlaceSummaryResponse(
    UUID id,
    String name,
    String description,
    Double latitude,
    Double longitude,
    CategoryResponse category,
    CatalogSource source,
    // Google Maps
    String googlePlaceId,
    String address,
    String city,
    String country,
    String imageUrl,
    BigDecimal googleRating,
    Integer googleReviewCount,
    Integer priceLevel,
    Boolean isActive
) {
}
