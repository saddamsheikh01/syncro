package com.syncro.backend.domain.matchmaking.controller;

import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.service.UserMatchService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/matches/users")
@Tag(name = "Matches Users", description = "Match tra utenti")
@SecurityRequirement(name = "bearer-jwt")
public class UserMatchesController {

    private final UserMatchService userMatchService;

    public UserMatchesController(UserMatchService userMatchService) {
        this.userMatchService = userMatchService;
    }

    @GetMapping
    @Operation(summary = "Lista match utenti")
    public ResponseEntity<Page<UserMatchResponse>> getMatches(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "false") boolean refresh,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String domain
    ) {
        return ResponseEntity.ok(userMatchService.getMatches(principal, refresh, page, size, domain));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Dettaglio match con utente")
    public ResponseEntity<UserMatchResponse> getMatchWithUser(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId,
        @RequestParam(required = false) String domain
    ) {
        return ResponseEntity.ok(userMatchService.getMatchWithUser(principal, userId, domain));
    }

    @PostMapping("/{userId}/refresh")
    @Operation(summary = "Ricalcola match con utente")
    public ResponseEntity<UserMatchResponse> refreshMatchWithUser(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId,
        @RequestParam(required = false) String domain
    ) {
        return ResponseEntity.ok(userMatchService.refreshMatchWithUser(principal, userId, domain));
    }
}
