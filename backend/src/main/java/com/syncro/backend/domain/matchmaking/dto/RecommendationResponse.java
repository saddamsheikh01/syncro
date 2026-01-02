package com.syncro.backend.domain.matchmaking.dto;

import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record RecommendationResponse(
    UUID id,
    RecommendationType type,
    PlaceSummaryResponse place,
    ExperienceSummaryResponse experience,
    Integer score,
    Map<String, Object> breakdown,
    Instant createdAt
) {
}
