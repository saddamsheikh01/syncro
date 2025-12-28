package com.syncro.backend.domain.profile.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record UserPreferencesResponse(
    UUID id,
    UUID userId,
    Map<String, Object> matchmakingFilters,
    Map<String, Object> feedPreferences,
    Instant createdAt,
    Instant updatedAt
) {
}
