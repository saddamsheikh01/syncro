package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record PostResponse(
    UUID id,
    UUID userId,
    String content,
    String language,
    Double latitude,
    Double longitude,
    String scope,
    String mood,
    String timeframe,
    long likeCount,
    long commentCount,
    boolean likedByMe,
    Map<String, Long> reactions,
    String myReaction,
    boolean favoritedByMe,
    Integer matchScore,
    List<TaggedUserResponse> taggedUsers,
    Instant createdAt
) {
}
