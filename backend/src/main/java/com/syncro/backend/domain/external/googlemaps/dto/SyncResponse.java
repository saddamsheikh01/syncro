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
            "Sync completed: %d found, %d created, %d updated, %d errors",
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
