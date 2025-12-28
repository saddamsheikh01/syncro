package com.syncro.backend.domain.profile.mapper;

import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.entity.UserPreference;
import org.springframework.stereotype.Component;

@Component
public class UserPreferenceMapper {

    public UserPreferencesResponse toResponse(UserPreference preferences) {
        return new UserPreferencesResponse(
            preferences.getId(),
            preferences.getUser().getId(),
            preferences.getMatchmakingFilters(),
            preferences.getFeedPreferences(),
            preferences.getCreatedAt(),
            preferences.getUpdatedAt()
        );
    }
}
