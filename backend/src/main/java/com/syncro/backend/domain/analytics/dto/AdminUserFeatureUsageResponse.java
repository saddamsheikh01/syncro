package com.syncro.backend.domain.analytics.dto;

import java.util.List;
import java.util.UUID;

public record AdminUserFeatureUsageResponse(
    UUID userId,
    String email,
    String username,
    String fullName,
    String country,
    String city,
    String gender,
    Integer age,
    boolean onboardingCompleted,
    long chatUses,
    long mapUses,
    long matchUses,
    long momentsUses,
    long interestsCount,
    long testsCompleted,
    long testsRequired,
    boolean profileCompleted,
    int profileCompletionPercent,
    List<String> missingSections
) {
}
