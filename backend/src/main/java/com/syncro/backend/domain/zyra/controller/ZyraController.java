package com.syncro.backend.domain.zyra.controller;

import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraPlaceRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraTestRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraChatRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraProfileRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraBirthChartInterpretationRequest;
import com.syncro.backend.domain.zyra.dto.ZyraBirthChartInterpretationResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Elimina sessione Zyra")
    public ResponseEntity<Void> deleteSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID sessionId
    ) {
        zyraService.deleteSession(principal, sessionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sessions")
    @Operation(summary = "Elimina tutte le sessioni Zyra")
    public ResponseEntity<Void> deleteAllSessions(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        zyraService.deleteAllSessions(principal);
        return ResponseEntity.noContent().build();
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

    @GetMapping("/profile-recap")
    @Operation(summary = "Genera recap profilo con Zyra")
    public ResponseEntity<ZyraProfileRecapResponse> getProfileRecap(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage
    ) {
        ZyraProfileRecapResponse resp = zyraService.getProfileRecap(principal, parseAcceptLanguage(acceptLanguage));
        return ResponseEntity.ok(withSanitizedRecap(resp));
    }

    @PostMapping("/profile-recap/regenerate")
    @Operation(summary = "Force-regenera recap profilo (solo test results, nessun label)")
    public ResponseEntity<ZyraProfileRecapResponse> regenerateProfileRecap(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage
    ) {
        ZyraProfileRecapResponse resp = zyraService.regenerateProfileRecap(principal, parseAcceptLanguage(acceptLanguage));
        return ResponseEntity.ok(withSanitizedRecap(resp));
    }

    @GetMapping("/profile-recap/{userId}")
    @Operation(summary = "Genera recap profilo utente con Zyra")
    public ResponseEntity<ZyraProfileRecapResponse> getProfileRecapForUser(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage
    ) {
        ZyraProfileRecapResponse resp = zyraService.getProfileRecapForUser(principal, userId, parseAcceptLanguage(acceptLanguage));
        return ResponseEntity.ok(withSanitizedRecap(resp));
    }

    /** Recap is from DB (user_profile.zyra_recap), cache, or generation; always sanitize before response. */
    private ZyraProfileRecapResponse withSanitizedRecap(ZyraProfileRecapResponse resp) {
        if (resp == null) return resp;
        String recap = resp.recap();
        if (recap == null) return resp;
        String sanitized = zyraService.sanitizeRecapForResponse(recap);
        return sanitized.equals(recap) ? resp : new ZyraProfileRecapResponse(sanitized, resp.generatedAt());
    }

    private static String parseAcceptLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return null;
        }
        String first = acceptLanguage.split(",")[0].trim().toLowerCase();
        int dash = first.indexOf('-');
        return dash > 0 ? first.substring(0, dash) : first;
    }

    @GetMapping("/place-recap/{placeId}")
    @Operation(summary = "Genera recap luogo con Zyra")
    public ResponseEntity<ZyraPlaceRecapResponse> getPlaceRecap(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID placeId
    ) {
        return ResponseEntity.ok(zyraService.getPlaceRecap(principal, placeId));
    }

    @GetMapping("/chat-recap")
    @Operation(summary = "Genera recap conversazioni con Zyra")
    public ResponseEntity<ZyraChatRecapResponse> getChatRecap(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(zyraService.getChatRecap(principal));
    }

    @GetMapping("/test-recap/{submissionId}")
    @Operation(summary = "Genera recap test completato con Zyra")
    public ResponseEntity<ZyraTestRecapResponse> getTestRecap(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID submissionId
    ) {
        return ResponseEntity.ok(zyraService.getTestRecap(principal, submissionId));
    }

    @PostMapping("/interpret-birth-chart")
    @Operation(summary = "Translate birth chart placements into human-readable explanation (Zyra)")
    public ResponseEntity<ZyraBirthChartInterpretationResponse> interpretBirthChart(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ZyraBirthChartInterpretationRequest request,
        @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage
    ) {
        ZyraBirthChartInterpretationResponse response = zyraService.interpretBirthChart(
            principal,
            request,
            parseAcceptLanguage(acceptLanguage)
        );
        return ResponseEntity.ok(response);
    }
}
