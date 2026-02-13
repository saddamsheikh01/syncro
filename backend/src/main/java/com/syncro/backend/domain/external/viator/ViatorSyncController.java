package com.syncro.backend.domain.external.viator;

import com.syncro.backend.domain.external.viator.dto.ViatorSyncRequest;
import com.syncro.backend.domain.external.viator.dto.ViatorSyncResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sync/viator")
public class ViatorSyncController {

    private final ViatorConfig viatorConfig;
    private final ViatorSyncService viatorSyncService;

    public ViatorSyncController(
        ViatorConfig viatorConfig,
        ViatorSyncService viatorSyncService
    ) {
        this.viatorConfig = viatorConfig;
        this.viatorSyncService = viatorSyncService;
    }

    @PostMapping("/status")
    public ResponseEntity<StatusResponse> status() {
        boolean configured = viatorConfig.isConfigured();
        return ResponseEntity.ok(new StatusResponse(
            configured,
            configured ? "Viator API configurata correttamente" : "VIATOR_API_KEY mancante"
        ));
    }

    @PostMapping("/products")
    public ResponseEntity<ViatorSyncResponse> syncProducts(
        @Valid @RequestBody(required = false) ViatorSyncRequest request
    ) {
        ViatorSyncRequest safeRequest = request != null
            ? request
            : new ViatorSyncRequest(null, null, null, null, null);

        ViatorSyncService.SyncCommand command = new ViatorSyncService.SyncCommand(
            safeRequest.count(),
            safeRequest.maxPages(),
            safeRequest.modifiedSince(),
            Boolean.TRUE.equals(safeRequest.resetCursor()),
            safeRequest.language()
        );

        ViatorSyncResponse response = viatorSyncService.syncProducts(command);
        return response.errors() > 0
            ? ResponseEntity.badRequest().body(response)
            : ResponseEntity.ok(response);
    }

    public record StatusResponse(boolean configured, String message) {}
}
