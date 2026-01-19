package com.syncro.backend.domain.profile.dto;

import java.util.UUID;

public record UserSummaryResponse(
    UUID userId,
    String fullName,
    String city,
    String country,
    String avatarUrl,
    String visibility
) {
}
