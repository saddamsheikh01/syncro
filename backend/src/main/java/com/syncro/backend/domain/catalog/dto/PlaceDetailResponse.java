package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.tags.dto.TagResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
    // Google Maps
    String googlePlaceId,
    String address,
    String city,
    String country,
    String postalCode,
    String phone,
    String website,
    BigDecimal googleRating,
    Integer googleReviewCount,
    Integer priceLevel,
    String imageUrl,
    List<String> photos,
    Map<String, Object> openingHours,
    List<String> googleTypes,
    Boolean isActive,
    Instant lastSyncedAt,
    Instant createdAt,
    Instant updatedAt
) {
}
