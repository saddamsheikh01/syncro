package com.syncro.backend.domain.zyra.controller;

import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionResponse;
import com.syncro.backend.domain.zyra.service.ZyraService;
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
@RequestMapping("/api/v1/zyra")
@Tag(name = "Zyra", description = "Chat e suggerimenti Zyra")
@SecurityRequirement(name = "bearer-jwt")
public class ZyraController {

    private final ZyraService zyraService;

    public ZyraController(ZyraService zyraService) {
        this.zyraService = zyraService;
    }

    @PostMapping("/sessions")
    @Operation(summary = "Crea sessione Zyra")
    public ResponseEntity<ZyraSessionResponse> createSession(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(zyraService.createSession(principal));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Lista sessioni Zyra")
    public ResponseEntity<Page<ZyraSessionResponse>> getSessions(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(zyraService.getSessions(principal, page, size));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Lista messaggi Zyra")
    public ResponseEntity<Page<ZyraMessageResponse>> getMessages(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID sessionId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(zyraService.getMessages(principal, sessionId, page, size));
    }

    @PostMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Invia messaggio a Zyra")
    public ResponseEntity<ZyraChatResponse> sendMessage(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID sessionId,
        @Valid @RequestBody ZyraMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(zyraService.sendMessage(principal, sessionId, request));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Lista suggerimenti Zyra")
    public ResponseEntity<Page<ZyraSuggestionResponse>> getSuggestions(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(zyraService.getSuggestions(principal, page, size));
    }

    @PostMapping("/suggestions")
    @Operation(summary = "Genera suggerimento Zyra")
    public ResponseEntity<ZyraSuggestionResponse> createSuggestion(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ZyraSuggestionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(zyraService.createSuggestion(principal, request));
    }
}
