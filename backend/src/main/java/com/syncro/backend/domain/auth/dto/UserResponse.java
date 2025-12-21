package com.syncro.backend.domain.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String language,
    boolean onboardingCompleted,
    String status,
    Instant createdAt,
    Instant updatedAt
) {
}
