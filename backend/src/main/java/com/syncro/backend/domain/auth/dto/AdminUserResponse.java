package com.syncro.backend.domain.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String email,
    String role,
    String status,
    Instant lastLogin,
    Instant createdAt
) {
}
