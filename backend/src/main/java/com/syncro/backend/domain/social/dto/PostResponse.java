package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.UUID;

public record PostResponse(
    UUID id,
    UUID userId,
    String content,
    String language,
    Double latitude,
    Double longitude,
    long likeCount,
    boolean likedByMe,
    Instant createdAt
) {
}
