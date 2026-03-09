package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;
import java.util.List;

public record ZyraProfileRecapResponse(
    String recap,
    List<String> highlights,
    Instant generatedAt
) {
    public ZyraProfileRecapResponse(String recap, Instant generatedAt) {
        this(recap, null, generatedAt);
    }
}
