package com.syncro.backend.domain.social.dto;

import com.syncro.backend.domain.social.entity.ConnectionContext;
import com.syncro.backend.domain.social.entity.ConnectionStatus;
import java.time.Instant;
import java.util.UUID;

public record ConnectionResponse(
    UUID id,
    UUID fromUserId,
    UUID toUserId,
    ConnectionStatus status,
    ConnectionContext context,
    Instant createdAt,
    Instant updatedAt
) {
}
