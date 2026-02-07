package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.UUID;

public record PostMediaPreviewResponse(
    UUID id,
    String url,
    String mediaType,
    Instant createdAt
) {
}
