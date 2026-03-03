package com.syncro.backend.domain.analytics.dto;

import java.util.List;
import java.util.UUID;

public record AdminUserAnalyticsResponse(
    UUID userId,
    String email,
    String username,
    String fullName,
    boolean onboardingCompleted,
    String country,
    String city,
    String gender,
    Integer age,
    long chatUses,
    long mapUses,
    long matchUses,
    long momentsUses,
    long interestsCount,
    long testsCompleted,
    long testsRequired,
    boolean profileCompleted,
    int profileCompletionPercent,
    List<String> missingSections,
    List<KpiPoint> chatDaily,
    List<KpiPoint> mapDaily,
    List<KpiPoint> matchDaily,
    List<KpiPoint> momentsDaily
) {
}
