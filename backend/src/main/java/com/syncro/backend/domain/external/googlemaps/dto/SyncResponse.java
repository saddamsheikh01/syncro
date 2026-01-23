package com.syncro.backend.domain.external.googlemaps.dto;

import java.util.List;

public record SyncResponse(
    int totalFound,
    int created,
    int updated,
    int errors,
    List<String> errorMessages,
    String message
) {
    public static SyncResponse fromResult(
        com.syncro.backend.domain.external.googlemaps.GoogleMapsSyncService.SyncResult result
    ) {
        String message = String.format(
            "Sincronizzazione completata: %d trovati, %d creati, %d aggiornati, %d errori",
            result.totalFound(),
            result.created(),
            result.updated(),
            result.errors()
        );
        return new SyncResponse(
            result.totalFound(),
            result.created(),
            result.updated(),
            result.errors(),
            result.errorMessages(),
            message
        );
    }
}
