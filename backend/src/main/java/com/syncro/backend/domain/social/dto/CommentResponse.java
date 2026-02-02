package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    UUID postId,
    UUID userId,
    String username,
    String userFullName,
    String userAvatarUrl,
    String content,
    Instant createdAt
) {
}
