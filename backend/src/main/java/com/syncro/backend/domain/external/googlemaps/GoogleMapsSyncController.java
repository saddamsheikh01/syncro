package com.syncro.backend.domain.external.googlemaps;

import com.syncro.backend.domain.external.googlemaps.dto.SyncRequest;
import com.syncro.backend.domain.external.googlemaps.dto.SyncResponse;
import com.syncro.backend.domain.external.googlemaps.dto.TextSearchSyncRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sync/google-maps")
public class GoogleMapsSyncController {

    private final GoogleMapsSyncService syncService;
    private final GoogleMapsConfig config;

    public GoogleMapsSyncController(GoogleMapsSyncService syncService, GoogleMapsConfig config) {
        this.syncService = syncService;
        this.config = config;
    }

    /**
     * Verifica se Google Maps API è configurata.
     */
    @PostMapping("/status")
    public ResponseEntity<StatusResponse> getStatus() {
        boolean configured = config.isConfigured();
        return ResponseEntity.ok(new StatusResponse(
            configured,
            configured ? "Google Maps API configurata correttamente" : "API key mancante"
        ));
    }

    /**
     * Sincronizza luoghi vicini a una posizione.
     * Tipo comune: restaurant, cafe, bar, museum, park, tourist_attraction, etc.
     */
    @PostMapping("/nearby")
    public ResponseEntity<SyncResponse> syncNearby(@Valid @RequestBody SyncRequest request) {
        if (!config.isConfigured()) {
            return ResponseEntity.badRequest().body(new SyncResponse(
                0, 0, 0, 1,
                java.util.List.of("Google Maps API key non configurata"),
                "Errore di configurazione"
            ));
        }

        GoogleMapsSyncService.SyncResult result = syncService.syncNearbyPlaces(
            request.latitude(),
            request.longitude(),
            request.radiusMeters(),
            request.type(),
            request.maxResults()
        );

        return ResponseEntity.ok(SyncResponse.fromResult(result));
    }

    /**
     * Sincronizza luoghi da una ricerca testuale.
     * Es: "ristoranti a Roma", "musei Milano", "bar Trastevere"
     */
    @PostMapping("/search")
    public ResponseEntity<SyncResponse> syncBySearch(@Valid @RequestBody TextSearchSyncRequest request) {
        if (!config.isConfigured()) {
            return ResponseEntity.badRequest().body(new SyncResponse(
                0, 0, 0, 1,
                java.util.List.of("Google Maps API key non configurata"),
                "Errore di configurazione"
            ));
        }

        GoogleMapsSyncService.SyncResult result = syncService.syncByTextSearch(
            request.query(),
            request.latitude(),
            request.longitude(),
            request.radiusMeters(),
            request.maxResults()
        );

        return ResponseEntity.ok(SyncResponse.fromResult(result));
    }

    /**
     * Sincronizza un singolo luogo dal suo Google Place ID.
     */
    @PostMapping("/place/{googlePlaceId}")
    public ResponseEntity<SyncResponse> syncSinglePlace(
        @PathVariable @NotBlank String googlePlaceId
    ) {
        if (!config.isConfigured()) {
            return ResponseEntity.badRequest().body(new SyncResponse(
                0, 0, 0, 1,
                java.util.List.of("Google Maps API key non configurata"),
                "Errore di configurazione"
            ));
        }

        GoogleMapsSyncService.SyncResult result = syncService.syncSinglePlaceById(googlePlaceId);

        return ResponseEntity.ok(SyncResponse.fromResult(result));
    }

    public record StatusResponse(boolean configured, String message) {}
}
