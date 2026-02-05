package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.UUID;

public record PostSummaryResponse(
    UUID id,
    UUID userId,
    String content,
    String scope,
    String mood,
    String timeframe,
    Instant createdAt
) {
}
