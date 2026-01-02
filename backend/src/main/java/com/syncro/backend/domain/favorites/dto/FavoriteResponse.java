package com.syncro.backend.domain.favorites.dto;

import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import java.time.Instant;
import java.util.UUID;

public record FavoriteResponse(
    UUID id,
    FavoriteType type,
    PlaceSummaryResponse place,
    ExperienceSummaryResponse experience,
    Instant createdAt
) {
}
