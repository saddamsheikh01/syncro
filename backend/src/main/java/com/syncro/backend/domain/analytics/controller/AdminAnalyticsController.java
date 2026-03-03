package com.syncro.backend.domain.analytics.controller;

import com.syncro.backend.domain.analytics.dto.AdminUserFeatureUsageResponse;
import com.syncro.backend.domain.analytics.dto.AdminUserAnalyticsResponse;
import com.syncro.backend.domain.analytics.dto.AnalyticsKpiResponse;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@Tag(name = "Admin Analytics", description = "KPI e analytics base")
@SecurityRequirement(name = "bearer-jwt")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    public AdminAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @Operation(summary = "KPI analytics")
    public ResponseEntity<AnalyticsKpiResponse> getKpis(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(analyticsService.getKpis(principal, from, to));
    }

    @GetMapping("/users")
    @Operation(summary = "Utilizzo funzionalita e completamento profilo per utente")
    public ResponseEntity<Page<AdminUserFeatureUsageResponse>> getUsersFeatureUsage(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            analyticsService.getUsersFeatureUsage(principal, from, to, q, page, size)
        );
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Analytics dettaglio utente")
    public ResponseEntity<AdminUserAnalyticsResponse> getUserAnalytics(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(
            analyticsService.getUserAnalytics(principal, userId, from, to)
        );
    }

    @PostMapping("/refresh")
    @Operation(summary = "Ricalcola i KPI giornalieri analytics")
    public ResponseEntity<Void> refreshKpis(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        analyticsService.refreshDailyKpis(principal, from, to);
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }
}
