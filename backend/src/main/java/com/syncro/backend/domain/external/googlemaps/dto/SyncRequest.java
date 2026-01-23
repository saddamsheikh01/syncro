package com.syncro.backend.domain.external.googlemaps.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SyncRequest(
    @NotNull(message = "La latitudine è obbligatoria")
    @Min(value = -90, message = "Latitudine non valida")
    @Max(value = 90, message = "Latitudine non valida")
    Double latitude,

    @NotNull(message = "La longitudine è obbligatoria")
    @Min(value = -180, message = "Longitudine non valida")
    @Max(value = 180, message = "Longitudine non valida")
    Double longitude,

    @Min(value = 100, message = "Il raggio minimo è 100 metri")
    @Max(value = 50000, message = "Il raggio massimo è 50000 metri")
    Integer radiusMeters,

    String type,

    @Min(value = 1, message = "Minimo 1 risultato")
    @Max(value = 60, message = "Massimo 60 risultati")
    Integer maxResults
) {
    public SyncRequest {
        if (radiusMeters == null) {
            radiusMeters = 5000;
        }
        if (type == null || type.isBlank()) {
            type = "point_of_interest";
        }
        if (maxResults == null) {
            maxResults = 20;
        }
    }
}
