package com.syncro.backend.domain.social.dto;

import java.util.UUID;

public record ChatParticipantInfo(
    UUID userId,
    String fullName,
    String avatarUrl
) {
}
