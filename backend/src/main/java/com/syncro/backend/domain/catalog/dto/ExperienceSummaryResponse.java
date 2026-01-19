package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.math.BigDecimal;
import java.util.UUID;

public record ExperienceSummaryResponse(
    UUID id,
    String name,
    String description,
    CategoryResponse category,
    PlaceReferenceResponse place,
    CatalogSource source,
    // Provider esterni
    String provider,
    String imageUrl,
    BigDecimal price,
    String priceCurrency,
    BigDecimal originalPrice,
    Integer durationMinutes,
    BigDecimal rating,
    Integer reviewCount,
    String locationName,
    Boolean isActive
) {
}
