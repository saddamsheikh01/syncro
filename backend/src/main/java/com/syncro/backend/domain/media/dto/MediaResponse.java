package com.syncro.backend.domain.media.dto;

import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.entity.MediaType;
import java.time.Instant;
import java.util.UUID;

public record MediaResponse(
    UUID id,
    String url,
    MediaType mediaType,
    MediaOwnerType ownerType,
    UUID ownerId,
    Instant createdAt
) {
}
