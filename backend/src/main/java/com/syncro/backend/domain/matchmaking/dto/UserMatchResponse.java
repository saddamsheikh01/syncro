package com.syncro.backend.domain.matchmaking.dto;

import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record UserMatchResponse(
    UUID matchId,
    UUID userId,
    UserSummaryResponse user,
    Integer scoreTotal,
    Map<String, Object> breakdown,
    String explanation,
    Instant createdAt,
    Instant updatedAt
) {
}
