package com.syncro.backend.domain.expats.controller;

import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.domain.expats.dto.CreateFunnelConfigRequest;
import com.syncro.backend.domain.expats.dto.FunnelConfigResponse;
import com.syncro.backend.domain.expats.dto.UpdateFunnelConfigRequest;
import com.syncro.backend.domain.expats.service.ExpatsFunnelConfigService;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.service.CityDatasetService;
import com.syncro.backend.domain.relocation.service.ScoringConfigService;
import com.syncro.backend.domain.relocation.service.WaitingListService;
import com.syncro.backend.domain.relocation.service.WeightRuleService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/expats")
@Validated
@Tag(name = "Admin Expats", description = "Gestione admin: funnel config, dataset citta, weight rules, scoring config, waiting list")
@SecurityRequirement(name = "bearer-jwt")
public class AdminExpatsController {

    private final ExpatsFunnelConfigService funnelConfigService;
    private final CityDatasetService cityDatasetService;
    private final WeightRuleService weightRuleService;
    private final ScoringConfigService scoringConfigService;
    private final WaitingListService waitingListService;
    private final AdminUserRepository adminUserRepository;

    public AdminExpatsController(ExpatsFunnelConfigService funnelConfigService,
                                 CityDatasetService cityDatasetService,
                                 WeightRuleService weightRuleService,
                                 ScoringConfigService scoringConfigService,
                                 WaitingListService waitingListService,
                                 AdminUserRepository adminUserRepository) {
        this.funnelConfigService = funnelConfigService;
        this.cityDatasetService = cityDatasetService;
        this.weightRuleService = weightRuleService;
        this.scoringConfigService = scoringConfigService;
        this.waitingListService = waitingListService;
        this.adminUserRepository = adminUserRepository;
    }

    // ========== FUNNEL CONFIG CRUD ==========

    @GetMapping("/funnel-configs")
    @Operation(summary = "Lista tutte le configurazioni funnel (tutte le versioni, attive e non)")
    public ResponseEntity<List<FunnelConfigResponse>> listFunnelConfigs() {
        return ResponseEntity.ok(funnelConfigService.listAll());
    }

    @GetMapping("/funnel-configs/{configId}")
    @Operation(summary = "Dettaglio configurazione funnel")
    public ResponseEntity<FunnelConfigResponse> getFunnelConfig(@PathVariable UUID configId) {
        return ResponseEntity.ok(funnelConfigService.getById(configId));
    }

    @PostMapping("/funnel-configs")
    @Operation(summary = "Crea nuova versione configurazione funnel")
    public ResponseEntity<FunnelConfigResponse> createFunnelConfig(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody CreateFunnelConfigRequest request) {
        AdminUser admin = resolveAdmin(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(funnelConfigService.create(request, admin));
    }

    @PutMapping("/funnel-configs/{configId}")
    @Operation(summary = "Aggiorna configurazione funnel (contenuto, feature flags, attiva/disattiva)")
    public ResponseEntity<FunnelConfigResponse> updateFunnelConfig(
            @AuthenticationPrincipal AdminPrincipal principal,
            @PathVariable UUID configId,
            @Valid @RequestBody UpdateFunnelConfigRequest request) {
        AdminUser admin = resolveAdmin(principal);
        return ResponseEntity.ok(funnelConfigService.update(configId, request, admin));
    }

    // ========== CITY DATASET CRUD ==========

    @GetMapping("/cities")
    @Operation(summary = "Lista tutte le citta (attive e non attive)")
    public ResponseEntity<List<CityDatasetResponse>> listAllCities() {
        return ResponseEntity.ok(cityDatasetService.listAllCities());
    }

    @GetMapping("/cities/{cityId}")
    @Operation(summary = "Dettaglio citta con tutti i campi grezzi e macroaree")
    public ResponseEntity<CityDatasetResponse> getCity(@PathVariable UUID cityId) {
        return ResponseEntity.ok(cityDatasetService.getCity(cityId));
    }

    @PostMapping("/cities")
    @Operation(summary = "Crea nuova citta nel dataset (triggera ricalcolo macroaree per tutte le citta)")
    public ResponseEntity<CityDatasetResponse> createCity(
            @AuthenticationPrincipal AdminPrincipal principal,
            @Valid @RequestBody CreateCityDatasetRequest request) {
        AdminUser admin = resolveAdmin(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cityDatasetService.createCity(request, admin));
    }

    @PutMapping("/cities/{cityId}")
    @Operation(summary = "Aggiorna citta nel dataset (triggera ricalcolo macroaree per tutte le citta)")
    public ResponseEntity<CityDatasetResponse> updateCity(
            @AuthenticationPrincipal AdminPrincipal principal,
            @PathVariable UUID cityId,
            @Valid @RequestBody UpdateCityDatasetRequest request) {
        AdminUser admin = resolveAdmin(principal);
        return ResponseEntity.ok(cityDatasetService.updateCity(cityId, request, admin));
    }

    @PostMapping("/cities/recalculate-macroaree")
    @Operation(summary = "Forza ricalcolo macroaree per tutte le citta attive")
    public ResponseEntity<Map<String, Object>> recalculateMacroaree() {
        cityDatasetService.recalculateAllMacroaree();
        long count = cityDatasetService.listAllCities().stream()
                .filter(c -> Boolean.TRUE.equals(c.active()))
                .count();
        return ResponseEntity.ok(Map.of("recalculated", count, "status", "ok"));
    }

    // ========== WEIGHT RULES CRUD ==========

    @GetMapping("/weight-rules")
    @Operation(summary = "Lista tutte le weight rules (attive e non attive)")
    public ResponseEntity<List<WeightRuleResponse>> listAllWeightRules() {
        return ResponseEntity.ok(weightRuleService.listAll());
    }

    @GetMapping("/weight-rules/{ruleId}")
    @Operation(summary = "Dettaglio weight rule")
    public ResponseEntity<WeightRuleResponse> getWeightRule(@PathVariable UUID ruleId) {
        return ResponseEntity.ok(weightRuleService.getById(ruleId));
    }

    @PostMapping("/weight-rules")
    @Operation(summary = "Crea nuova weight rule (mapping risposta -> pesi macroaree)")
    public ResponseEntity<WeightRuleResponse> createWeightRule(
            @Valid @RequestBody CreateWeightRuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weightRuleService.create(request));
    }

    @PutMapping("/weight-rules/{ruleId}")
    @Operation(summary = "Aggiorna weight rule (pesi o attiva/disattiva)")
    public ResponseEntity<WeightRuleResponse> updateWeightRule(
            @PathVariable UUID ruleId,
            @Valid @RequestBody UpdateWeightRuleRequest request) {
        return ResponseEntity.ok(weightRuleService.update(ruleId, request));
    }

    // ========== SCORING CONFIG CRUD ==========

    @GetMapping("/scoring-config")
    @Operation(summary = "Configurazione scoring attiva")
    public ResponseEntity<ScoringConfigResponse> getScoringConfig() {
        return ResponseEntity.ok(scoringConfigService.getActiveConfig());
    }

    @PutMapping("/scoring-config/{configId}")
    @Operation(summary = "Aggiorna configurazione scoring: soglie compatibilita, budget, penalty, lifestyle, priorita, performance citta")
    public ResponseEntity<ScoringConfigResponse> updateScoringConfig(
            @AuthenticationPrincipal AdminPrincipal principal,
            @PathVariable UUID configId,
            @Valid @RequestBody UpdateScoringConfigRequest request) {
        AdminUser admin = resolveAdmin(principal);
        return ResponseEntity.ok(scoringConfigService.update(configId, request, admin));
    }

    // ========== WAITING LIST ==========

    @GetMapping("/waiting-list")
    @Operation(summary = "Lista waiting list (utenti in attesa di citta non ancora disponibili)")
    public ResponseEntity<List<WaitingListResponse>> getWaitingList() {
        return ResponseEntity.ok(waitingListService.getWaitingListEntries());
    }

    @PostMapping("/waiting-list/{cityName}/notify")
    @Operation(summary = "Segna come notificati tutti gli utenti in attesa per una citta")
    public ResponseEntity<Map<String, Object>> markWaitingListNotified(@PathVariable String cityName) {
        int notified = waitingListService.markAsNotified(cityName);
        return ResponseEntity.ok(Map.of(
                "cityName", cityName,
                "notifiedCount", notified
        ));
    }

    // ========== UTILITY ==========

    private AdminUser resolveAdmin(AdminPrincipal principal) {
        return adminUserRepository.findById(principal.adminId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin not found"));
    }
}
