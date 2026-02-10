package com.syncro.backend.domain.analytics.controller;

import com.syncro.backend.domain.analytics.dto.AnalyticsKpiResponse;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
