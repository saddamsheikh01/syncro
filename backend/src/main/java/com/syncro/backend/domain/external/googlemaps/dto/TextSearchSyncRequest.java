package com.syncro.backend.domain.external.googlemaps.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record TextSearchSyncRequest(
    @NotBlank(message = "La query di ricerca è obbligatoria")
    String query,

    @Min(value = -90, message = "Latitudine non valida")
    @Max(value = 90, message = "Latitudine non valida")
    Double latitude,

    @Min(value = -180, message = "Longitudine non valida")
    @Max(value = 180, message = "Longitudine non valida")
    Double longitude,

    @Min(value = 100, message = "Il raggio minimo è 100 metri")
    @Max(value = 50000, message = "Il raggio massimo è 50000 metri")
    Integer radiusMeters,

    @Min(value = 1, message = "Minimo 1 risultato")
    @Max(value = 60, message = "Massimo 60 risultati")
    Integer maxResults
) {
    public TextSearchSyncRequest {
        if (maxResults == null) {
            maxResults = 20;
        }
    }
}
