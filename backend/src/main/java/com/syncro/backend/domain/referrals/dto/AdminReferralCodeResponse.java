package com.syncro.backend.domain.referrals.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminReferralCodeResponse(
    UUID userId,
    String email,
    String username,
    String code,
    int usesCount,
    Instant createdAt
) {
}
