package com.syncro.backend.domain.zyra.dto;

import com.syncro.backend.domain.zyra.entity.ZyraMessageRole;
import java.time.Instant;
import java.util.UUID;

public record ZyraMessageResponse(
    UUID id,
    UUID sessionId,
    ZyraMessageRole role,
    String content,
    Instant createdAt
) {
}
