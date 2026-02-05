package com.syncro.backend.domain.referrals.dto;

import java.time.Instant;

public record ReferralLinkResponse(
    String code,
    int usesCount,
    Instant createdAt
) {
}
