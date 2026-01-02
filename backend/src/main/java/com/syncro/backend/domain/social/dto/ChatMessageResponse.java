package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(
    UUID id,
    UUID conversationId,
    UUID userId,
    String content,
    Instant createdAt
) {
}
