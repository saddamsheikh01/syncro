package com.syncro.backend.domain.external.viator.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;

public record ViatorSyncRequest(
    @Min(value = 1, message = "Minimo 1 elemento per pagina")
    @Max(value = 500, message = "Massimo 500 elementi per pagina")
    Integer count,

    @Min(value = 1, message = "Minimo 1 pagina")
    @Max(value = 200, message = "Massimo 200 pagine")
    Integer maxPages,

    Instant modifiedSince,

    Boolean resetCursor,

    String language
) {
    public ViatorSyncRequest {
        if (count == null) {
            count = 100;
        }
        if (maxPages == null) {
            maxPages = 5;
        }
        if (resetCursor == null) {
            resetCursor = false;
        }
    }
}
