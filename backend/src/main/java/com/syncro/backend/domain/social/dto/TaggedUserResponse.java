package com.syncro.backend.domain.social.dto;

import java.util.UUID;

public record TaggedUserResponse(
    UUID userId,
    String username,
    String fullName,
    String avatarUrl
) {
}
