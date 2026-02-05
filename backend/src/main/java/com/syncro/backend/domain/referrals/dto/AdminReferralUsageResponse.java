package com.syncro.backend.domain.referrals.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminReferralUsageResponse(
    UUID invitedUserId,
    String invitedEmail,
    String invitedUsername,
    Instant createdAt,
    String ip,
    String userAgent
) {
}
