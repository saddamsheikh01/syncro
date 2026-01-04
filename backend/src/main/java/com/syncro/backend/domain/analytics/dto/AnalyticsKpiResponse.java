package com.syncro.backend.domain.analytics.dto;

import java.util.List;

public record AnalyticsKpiResponse(
    List<KpiPoint> registrationsDaily,
    List<KpiPoint> registrationsWeekly,
    List<KpiPoint> onboardingCompletedDaily,
    List<KpiPoint> onboardingCompletedWeekly,
    List<KpiPoint> activeUsersDaily,
    List<KpiPoint> activeUsersWeekly,
    long returningUsers,
    List<KpiPoint> matchSectionOpenedDaily,
    List<KpiPoint> profileViewedDaily,
    List<KpiPoint> mapOpenedDaily,
    double averageSessionDurationSeconds
) {
}
