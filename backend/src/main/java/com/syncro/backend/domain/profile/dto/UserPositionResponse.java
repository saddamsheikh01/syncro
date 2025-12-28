package com.syncro.backend.domain.profile.dto;

import java.time.Instant;
import java.util.UUID;

public record UserPositionResponse(
    UUID userId,
    Double latitude,
    Double longitude,
    Double accuracyMeters,
    Instant updatedAt
) {
}
