package com.syncro.backend.domain.relocation.controller;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.service.CityComparisonService;
import com.syncro.backend.domain.relocation.service.CityDatasetService;
import com.syncro.backend.domain.relocation.service.RelocationOnboardingService;
import com.syncro.backend.domain.relocation.service.RelocationScoringService;
import com.syncro.backend.domain.relocation.service.WaitingListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/relocation")
@Validated
@Tag(name = "Relocation", description = "Onboarding relocation, city scoring, waiting list")
@SecurityRequirement(name = "bearer-jwt")
public class RelocationController {

    private final RelocationOnboardingService onboardingService;
    private final RelocationScoringService scoringService;
    private final CityComparisonService comparisonService;
    private final CityDatasetService cityDatasetService;
    private final WaitingListService waitingListService;

    public RelocationController(RelocationOnboardingService onboardingService,
                                RelocationScoringService scoringService,
                                CityComparisonService comparisonService,
                                CityDatasetService cityDatasetService,
                                WaitingListService waitingListService) {
        this.onboardingService = onboardingService;
        this.scoringService = scoringService;
        this.comparisonService = comparisonService;
        this.cityDatasetService = cityDatasetService;
        this.waitingListService = waitingListService;
    }

    // ========== ONBOARDING ==========

    @GetMapping("/onboarding")
    @Operation(summary = "Recupera profilo onboarding relocation dell'utente autenticato")
    public ResponseEntity<OnboardingResponse> getOnboarding(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(onboardingService.getOnboarding(user));
    }

    @PatchMapping("/onboarding")
    @Operation(summary = "Aggiorna profilo onboarding (salvataggio progressivo)")
    public ResponseEntity<OnboardingResponse> updateOnboarding(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateOnboardingRequest request) {
        return ResponseEntity.ok(onboardingService.updateOnboarding(user, request));
    }

    @GetMapping("/onboarding/status")
    @Operation(summary = "Stato onboarding: step completati, percentuale, snapshot attivo")
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(onboardingService.getOnboardingStatus(user));
    }

    @GetMapping("/activation-state")
    @Operation(summary = "Stato attivazione post-registrazione: step completati, mancanti, next actions")
    public ResponseEntity<ActivationStateResponse> getActivationState(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(onboardingService.getActivationState(user));
    }

    // ========== SNAPSHOTS ==========

    @PostMapping("/onboarding/snapshots")
    @Operation(summary = "Crea nuovo snapshot immutabile dal profilo completato")
    public ResponseEntity<SnapshotResponse> createSnapshot(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(onboardingService.createSnapshot(user));
    }

    @GetMapping("/onboarding/snapshots")
    @Operation(summary = "Lista snapshot versioni (piu recente prima)")
    public ResponseEntity<List<SnapshotResponse>> getSnapshots(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(onboardingService.getSnapshots(user));
    }

    // ========== CITY SCORING ==========

    @PostMapping("/city-scoring/compute")
    @Operation(summary = "Calcola City Fit Score basato su snapshot attivo e macroaree citta")
    public ResponseEntity<ScoringResultResponse> computeScoring(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody(required = false) ComputeScoringRequest request) {
        return ResponseEntity.ok(scoringService.computeScoring(user, request));
    }

    @GetMapping("/city-scoring/history")
    @Operation(summary = "Storico scoring utente (tutti i calcoli precedenti)")
    public ResponseEntity<List<CityScoreResponse>> getScoringHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(scoringService.getHistory(user));
    }

    @GetMapping("/city-scoring/latest/{snapshotId}")
    @Operation(summary = "Ultimi score per un dato snapshot")
    public ResponseEntity<List<CityScoreResponse>> getLatestScores(
            @AuthenticationPrincipal User user,
            @PathVariable UUID snapshotId) {
        return ResponseEntity.ok(scoringService.getLatestScores(user, snapshotId));
    }

    // ========== CITIES (public data, authenticated) ==========

    @GetMapping("/cities")
    @Operation(summary = "Lista citta attive con macroaree (summary)")
    public ResponseEntity<List<CityDatasetSummaryResponse>> listCities() {
        return ResponseEntity.ok(cityDatasetService.listActiveCities());
    }

    @GetMapping("/cities/{cityId}")
    @Operation(summary = "Dettaglio citta con tutti gli indici e macroaree")
    public ResponseEntity<CityDatasetResponse> getCity(@PathVariable UUID cityId) {
        return ResponseEntity.ok(cityDatasetService.getCity(cityId));
    }

    @GetMapping("/cities/slug/{slug}")
    @Operation(summary = "Dettaglio citta per slug")
    public ResponseEntity<CityDatasetResponse> getCityBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(cityDatasetService.getCityBySlug(slug));
    }

    // ========== CITY COMPARISON ==========

    @PostMapping("/city-scoring/compare")
    @Operation(summary = "Confronta due citta basandosi su profilo utente e priorita")
    public ResponseEntity<CityComparisonResponse> compareCities(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CityComparisonRequest request) {
        return ResponseEntity.ok(comparisonService.compareCities(user, request));
    }

    // ========== WAITING LIST ==========

    @PostMapping("/waiting-list")
    @Operation(summary = "Iscriviti alla waiting list per una citta non ancora disponibile")
    public ResponseEntity<Map<String, Object>> joinWaitingList(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WaitingListRequest request) {
        return ResponseEntity.ok(waitingListService.joinWaitingList(request, user));
    }
}
