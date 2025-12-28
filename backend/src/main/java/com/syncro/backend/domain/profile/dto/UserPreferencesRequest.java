package com.syncro.backend.domain.profile.dto;

import java.util.Map;

public record UserPreferencesRequest(
    Map<String, Object> matchmakingFilters,
    Map<String, Object> feedPreferences
) {
}
