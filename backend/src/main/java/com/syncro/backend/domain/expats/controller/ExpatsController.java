package com.syncro.backend.domain.expats.controller;

import com.syncro.backend.domain.expats.dto.*;
import com.syncro.backend.domain.expats.service.ExpatsFunnelConfigService;
import com.syncro.backend.domain.expats.service.ExpatsSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expats")
@Validated
@Tag(name = "Expats Funnel", description = "Funnel anonimo per expats: configurazione, sessioni, risposte")
public class ExpatsController {

    private final ExpatsFunnelConfigService configService;
    private final ExpatsSessionService sessionService;

    public ExpatsController(ExpatsFunnelConfigService configService,
                            ExpatsSessionService sessionService) {
        this.configService = configService;
        this.sessionService = sessionService;
    }

    @GetMapping("/funnel/config")
    @Operation(summary = "Configurazione funnel attiva per lingua e chiave")
    public ResponseEntity<FunnelConfigResponse> getFunnelConfig(
            @RequestParam(defaultValue = "expats_landing_v1") String configKey,
            @RequestParam(defaultValue = "en") String language) {
        return ResponseEntity.ok(configService.getActiveConfig(configKey, language));
    }

    @PostMapping("/anonymous/sessions")
    @Operation(summary = "Crea nuova sessione anonima funnel")
    public ResponseEntity<SessionResponse> createSession(
            @RequestBody(required = false) CreateSessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(request));
    }

    @GetMapping("/anonymous/sessions/{sessionId}")
    @Operation(summary = "Recupera sessione anonima con risposte (resume)")
    public ResponseEntity<SessionResponse> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(sessionService.getSession(sessionId));
    }

    @PatchMapping("/anonymous/sessions/{sessionId}")
    @Operation(summary = "Aggiorna sessione: salva risposta step, aggiorna progresso")
    public ResponseEntity<SessionResponse> updateSession(
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateSessionRequest request) {
        return ResponseEntity.ok(sessionService.updateSession(sessionId, request));
    }
}
