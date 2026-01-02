package com.syncro.backend.domain.matchmaking.controller;

import com.syncro.backend.domain.matchmaking.dto.RecommendationResponse;
import com.syncro.backend.domain.matchmaking.service.RecommendationService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/matches/places")
@Tag(name = "Matches Places", description = "Raccomandazioni luoghi ed esperienze")
@SecurityRequirement(name = "bearer-jwt")
public class PlaceMatchesController {

    private final RecommendationService recommendationService;

    public PlaceMatchesController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    @Operation(summary = "Lista raccomandazioni")
    public ResponseEntity<Page<RecommendationResponse>> getRecommendations(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "false") boolean refresh,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(recommendationService.getRecommendations(principal, type, refresh, page, size));
    }
}
