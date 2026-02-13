package com.syncro.backend.domain.referrals.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminReferralDetailResponse(
    UUID userId,
    String email,
    String username,
    String code,
    int usesCount,
    Instant createdAt,
    int invitedCount,
    int onboardingCompletedCount,
    int profileCompletedCount,
    int insightsCompletedCount,
    int momentOrActivityCount
) {
}
