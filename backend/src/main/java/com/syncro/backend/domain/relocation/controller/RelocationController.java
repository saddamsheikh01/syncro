package com.syncro.backend.domain.relocation.controller;

import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.service.AnonymousRelocationService;
import com.syncro.backend.domain.relocation.service.CityComparisonService;
import com.syncro.backend.domain.relocation.service.CityDatasetService;
import com.syncro.backend.domain.relocation.service.RelocationOnboardingService;
import com.syncro.backend.domain.relocation.service.RelocationScoringService;
import com.syncro.backend.domain.relocation.service.WaitingListService;
import com.syncro.backend.security.AnonymousExpatPrincipal;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    private final AnonymousRelocationService anonymousRelocationService;

    public RelocationController(RelocationOnboardingService onboardingService,
                                RelocationScoringService scoringService,
                                CityComparisonService comparisonService,
                                CityDatasetService cityDatasetService,
                                WaitingListService waitingListService,
                                AnonymousRelocationService anonymousRelocationService) {
        this.onboardingService = onboardingService;
        this.scoringService = scoringService;
        this.comparisonService = comparisonService;
        this.cityDatasetService = cityDatasetService;
        this.waitingListService = waitingListService;
        this.anonymousRelocationService = anonymousRelocationService;
    }

    // ========== ONBOARDING ==========

    @GetMapping("/onboarding")
    @Operation(summary = "Profilo onboarding (utente registrato o sessione anonima expat)")
    public ResponseEntity<OnboardingResponse> getOnboarding(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.getOnboarding(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.getOnboarding(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PatchMapping("/onboarding")
    @Operation(summary = "Aggiorna profilo onboarding")
    public ResponseEntity<OnboardingResponse> updateOnboarding(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody UpdateOnboardingRequest request) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.updateOnboarding(up.userId(), request));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.patchOnboarding(ap.sessionId(), request));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/onboarding/status")
    @Operation(summary = "Stato onboarding")
    public ResponseEntity<OnboardingStatusResponse> getOnboardingStatus(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.getOnboardingStatus(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.getOnboardingStatus(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/activation-state")
    @Operation(summary = "Stato attivazione / WOW")
    public ResponseEntity<ActivationStateResponse> getActivationState(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.getActivationState(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.getActivationState(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ========== SNAPSHOTS ==========

    @PostMapping("/onboarding/snapshots")
    @Operation(summary = "Crea snapshot (registrato: profilo completato; anonimo: da funnel)")
    public ResponseEntity<SnapshotResponse> createSnapshot(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.createSnapshot(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.refreshSnapshotAsCreate(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/onboarding/snapshots")
    @Operation(summary = "Lista snapshot")
    public ResponseEntity<List<SnapshotResponse>> getSnapshots(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(onboardingService.getSnapshots(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.listSnapshots(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ========== CITY SCORING ==========

    @PostMapping("/city-scoring/compute")
    @Operation(summary = "Calcola City Fit Score")
    public ResponseEntity<ScoringResultResponse> computeScoring(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody(required = false) ComputeScoringRequest request) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(scoringService.computeScoring(up.userId(), request));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(scoringService.computeScoringAnonymous(ap.sessionId(), request));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/city-scoring/history")
    @Operation(summary = "Storico scoring")
    public ResponseEntity<List<CityScoreResponse>> getScoringHistory(@AuthenticationPrincipal Object principal) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(scoringService.getHistory(up.userId()));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(anonymousRelocationService.getHistory(ap.sessionId()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/city-scoring/latest/{snapshotId}")
    @Operation(summary = "Ultimi score per snapshot")
    public ResponseEntity<List<CityScoreResponse>> getLatestScores(
            @AuthenticationPrincipal Object principal,
            @PathVariable UUID snapshotId) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(scoringService.getLatestScores(up.userId(), snapshotId));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(scoringService.getLatestScoresAnonymous(ap.sessionId(), snapshotId));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ========== CITIES ==========

    @GetMapping("/cities")
    @Operation(summary = "Lista citta attive")
    public ResponseEntity<List<CityDatasetSummaryResponse>> listCities() {
        return ResponseEntity.ok(cityDatasetService.listActiveCities());
    }

    @GetMapping("/cities/{cityId}")
    @Operation(summary = "Dettaglio citta")
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
    @Operation(summary = "Confronta due citta")
    public ResponseEntity<CityComparisonResponse> compareCities(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody CityComparisonRequest request) {
        if (principal instanceof UserPrincipal up) {
            return ResponseEntity.ok(comparisonService.compareCities(up.userId(), request));
        }
        if (principal instanceof AnonymousExpatPrincipal ap) {
            return ResponseEntity.ok(comparisonService.compareCitiesAnonymous(ap.sessionId(), request));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // ========== WAITING LIST ==========

    @PostMapping("/waiting-list")
    @Operation(summary = "Waiting list (email; user opzionale)")
    public ResponseEntity<Map<String, Object>> joinWaitingList(
            @AuthenticationPrincipal Object principal,
            @Valid @RequestBody WaitingListRequest request) {
        UUID userId = principal instanceof UserPrincipal up ? up.userId() : null;
        return ResponseEntity.ok(waitingListService.joinWaitingList(request, userId));
    }
}
