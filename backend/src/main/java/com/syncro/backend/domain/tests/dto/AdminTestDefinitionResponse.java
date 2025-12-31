package com.syncro.backend.domain.tests.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminTestDefinitionResponse(
    UUID id,
    String title,
    String description,
    boolean active,
    Instant createdAt,
    Instant updatedAt
) {
}
