package com.syncro.backend.domain.external.viator.dto;

import java.time.Instant;
import java.util.UUID;

public record ViatorDestinationRefResponse(
    UUID id,
    String destinationRef,
    String cityName,
    boolean enabled,
    int sortOrder,
    Instant createdAt,
    Instant updatedAt
) {}
