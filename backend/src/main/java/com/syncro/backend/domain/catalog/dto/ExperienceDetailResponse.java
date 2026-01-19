package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.tags.dto.TagResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExperienceDetailResponse(
    UUID id,
    String name,
    String description,
    CategoryResponse category,
    PlaceReferenceResponse place,
    CatalogSource source,
    List<TagResponse> tags,
    List<AffiliationLinkResponse> affiliationLinks,
    Instant createdAt,
    Instant updatedAt,
    // Provider esterni
    String provider,
    String externalId,
    BigDecimal price,
    String priceCurrency,
    BigDecimal originalPrice,
    Integer durationMinutes,
    String imageUrl,
    List<String> images,
    String bookingUrl,
    BigDecimal rating,
    Integer reviewCount,
    BigDecimal latitude,
    BigDecimal longitude,
    String locationName,
    List<String> highlights,
    List<String> inclusions,
    List<String> exclusions,
    List<String> languages,
    String cancellationPolicy,
    String meetingPoint,
    Integer minParticipants,
    Integer maxParticipants,
    Instant lastSyncedAt,
    Boolean isActive
) {
}
