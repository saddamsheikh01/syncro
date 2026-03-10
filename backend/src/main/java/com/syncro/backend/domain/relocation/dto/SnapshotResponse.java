package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SnapshotResponse(
        UUID id,
        Integer version,
        Boolean isActive,
        Map<String, Object> payload,
        Instant createdAt
) {}
