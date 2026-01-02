package com.syncro.backend.domain.catalog.dto;

import java.util.UUID;

public record PlaceReferenceResponse(
    UUID id,
    String name,
    Double latitude,
    Double longitude
) {
}
