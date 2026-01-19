package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AdminExperienceUpdateRequest(
    String name,
    String description,
    UUID categoryId,
    UUID placeId,
    CatalogSource source,
    List<UUID> tagIds,
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
    Boolean isActive
) {
}
