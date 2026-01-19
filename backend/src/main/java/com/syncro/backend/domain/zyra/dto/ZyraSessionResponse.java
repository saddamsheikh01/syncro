package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;
import java.util.UUID;

public record ZyraSessionResponse(
    UUID id,
    UUID userId,
    String title,
    Instant createdAt
) {
}
