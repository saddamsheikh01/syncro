package com.syncro.backend.domain.backoffice.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AdminUserPreferencesResponse(
    UUID id,
    UUID userId,
    Map<String, Object> matchmakingFilters,
    Map<String, Object> feedPreferences,
    Boolean privacyPolicyAccepted,
    Instant privacyPolicyAcceptedAt,
    Boolean newsletterConsent,
    Instant newsletterConsentAt,
    UUID relocationProfileId,
    String relocationUserType,
    UUID relocationTargetCityId,
    String relocationTargetCityName,
    UUID relocationCurrentCityId,
    String relocationCurrentCityName,
    String relocationStatus,
    Integer relocationCompletedSteps,
    Integer relocationCompletionPercent,
    Instant createdAt,
    Instant updatedAt
) {
}
