package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.ConnectionResponse;
import com.syncro.backend.domain.social.dto.ConnectionStatusResponse;
import com.syncro.backend.domain.social.dto.SendConnectionRequest;
import com.syncro.backend.domain.social.entity.ConnectionStatus;
import com.syncro.backend.domain.social.service.ConnectionService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/connections")
@Tag(name = "Connections", description = "Connection requests and status")
@SecurityRequirement(name = "bearer-jwt")
public class ConnectionsController {

    private final ConnectionService connectionService;

    public ConnectionsController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @PostMapping
    @Operation(summary = "Send connection request")
    public ResponseEntity<ConnectionResponse> sendRequest(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody SendConnectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(connectionService.sendRequest(principal, request));
    }

    @PostMapping("/{connectionId}/accept")
    @Operation(summary = "Accept connection request")
    public ResponseEntity<ConnectionResponse> accept(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID connectionId
    ) {
        return ResponseEntity.ok(connectionService.accept(principal, connectionId));
    }

    @PostMapping("/{connectionId}/reject")
    @Operation(summary = "Reject connection request")
    public ResponseEntity<ConnectionResponse> reject(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID connectionId
    ) {
        return ResponseEntity.ok(connectionService.reject(principal, connectionId));
    }

    @GetMapping
    @Operation(summary = "List connections (sent and received)")
    public ResponseEntity<Page<ConnectionResponse>> list(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(connectionService.list(principal, page, size));
    }

    @GetMapping("/pending")
    @Operation(summary = "List pending requests received")
    public ResponseEntity<Page<ConnectionResponse>> listPendingReceived(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(connectionService.listPendingReceived(principal, page, size));
    }

    @GetMapping("/status")
    @Operation(summary = "Get connection status with another user")
    public ResponseEntity<ConnectionStatusResponse> getStatusWith(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam UUID userId
    ) {
        ConnectionStatus status = connectionService.getStatusWith(principal, userId);
        return ResponseEntity.ok(new ConnectionStatusResponse(status));
    }
}
