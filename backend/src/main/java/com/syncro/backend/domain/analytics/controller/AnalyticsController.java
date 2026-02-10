package com.syncro.backend.domain.analytics.controller;

import com.syncro.backend.domain.analytics.dto.AnalyticsBatchRequest;
import com.syncro.backend.domain.analytics.dto.AnalyticsBatchResponse;
import com.syncro.backend.domain.analytics.dto.AnalyticsEventRequest;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Tracking eventi analytics")
@SecurityRequirement(name = "bearer-jwt")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/events")
    @Operation(summary = "Registra un evento analytics")
    public ResponseEntity<Void> trackEvent(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AnalyticsEventRequest request
    ) {
        analyticsService.trackEvent(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/events/batch")
    @Operation(summary = "Registra un batch di eventi analytics")
    public ResponseEntity<AnalyticsBatchResponse> trackEventsBatch(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AnalyticsBatchRequest request
    ) {
        return ResponseEntity.ok(analyticsService.trackEventsBatch(principal, request));
    }
}
