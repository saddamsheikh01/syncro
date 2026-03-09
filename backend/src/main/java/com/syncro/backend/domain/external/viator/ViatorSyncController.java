package com.syncro.backend.domain.external.viator;

import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefCreateRequest;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefResponse;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefUpdateRequest;
import com.syncro.backend.domain.external.viator.dto.ViatorSyncRequest;
import com.syncro.backend.domain.external.viator.dto.ViatorSyncResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sync/viator")
public class ViatorSyncController {

    private final ViatorConfig viatorConfig;
    private final ViatorSyncService viatorSyncService;
    private final ViatorDestinationRefService viatorDestinationRefService;

    public ViatorSyncController(
        ViatorConfig viatorConfig,
        ViatorSyncService viatorSyncService,
        ViatorDestinationRefService viatorDestinationRefService
    ) {
        this.viatorConfig = viatorConfig;
        this.viatorSyncService = viatorSyncService;
        this.viatorDestinationRefService = viatorDestinationRefService;
    }

    @PostMapping("/status")
    public ResponseEntity<StatusResponse> status() {
        boolean configured = viatorConfig.isConfigured();
        int configuredDestinationCount = viatorDestinationRefService.countEnabledDestinationRefs();
        return ResponseEntity.ok(new StatusResponse(
            configured,
            configured ? "Viator API is configured correctly" : "VIATOR_API_KEY is missing",
            configuredDestinationCount
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

    @GetMapping("/destinations")
    public ResponseEntity<List<ViatorDestinationRefResponse>> listDestinations() {
        return ResponseEntity.ok(viatorDestinationRefService.listAll());
    }

    @PostMapping("/destinations")
    public ResponseEntity<ViatorDestinationRefResponse> createDestination(
        @Valid @RequestBody ViatorDestinationRefCreateRequest request
    ) {
        return ResponseEntity.status(201).body(viatorDestinationRefService.create(request));
    }

    @PatchMapping("/destinations/{destinationId}")
    public ResponseEntity<ViatorDestinationRefResponse> updateDestination(
        @PathVariable UUID destinationId,
        @Valid @RequestBody ViatorDestinationRefUpdateRequest request
    ) {
        return ResponseEntity.ok(viatorDestinationRefService.update(destinationId, request));
    }

    @DeleteMapping("/destinations/{destinationId}")
    public ResponseEntity<Void> deleteDestination(@PathVariable UUID destinationId) {
        viatorDestinationRefService.delete(destinationId);
        return ResponseEntity.noContent().build();
    }

    public record StatusResponse(boolean configured, String message, int configuredDestinationCount) {}
}
