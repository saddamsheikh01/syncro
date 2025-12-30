package com.syncro.backend.domain.tags.dto;

import java.util.UUID;

public record TagResponse(
    UUID id,
    String name
) {
}
