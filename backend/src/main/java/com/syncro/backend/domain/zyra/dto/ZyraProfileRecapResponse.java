package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;

public record ZyraProfileRecapResponse(
    String recap,
    Instant generatedAt
) {
}
