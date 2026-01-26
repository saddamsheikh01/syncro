package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;

public record ZyraPlaceRecapResponse(
    String recap,
    Instant generatedAt
) {
}
