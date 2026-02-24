package com.syncro.backend.domain.notifications.controller;

import com.syncro.backend.domain.notifications.dto.AdminCreateNotificationRequest;
import com.syncro.backend.domain.notifications.dto.AdminNotificationCampaignStatsResponse;
import com.syncro.backend.domain.notifications.dto.AdminNotificationCampaignSummaryResponse;
import com.syncro.backend.domain.notifications.dto.AdminNotificationRecipientResponse;
import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.service.AdminNotificationService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@Tag(name = "Admin Notifications", description = "Notifiche personalizzate back office")
@SecurityRequirement(name = "bearer-jwt")
public class AdminNotificationsController {

    private final AdminNotificationService adminNotificationService;

    public AdminNotificationsController(AdminNotificationService adminNotificationService) {
        this.adminNotificationService = adminNotificationService;
    }

    @PostMapping
    @Operation(summary = "Crea notifiche personalizzate")
    public ResponseEntity<List<NotificationResponse>> createCustomNotifications(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminCreateNotificationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminNotificationService.createCustomNotifications(principal, request));
    }

    @GetMapping("/recipients/search")
    @Operation(summary = "Ricerca destinatari notifiche per username o nome completo")
    public ResponseEntity<Page<AdminNotificationRecipientResponse>> searchRecipients(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(adminNotificationService.searchRecipients(principal, q, page, size));
    }

    @GetMapping("/campaigns/{campaignId}/stats")
    @Operation(summary = "Statistiche invio notifiche admin")
    public ResponseEntity<AdminNotificationCampaignStatsResponse> getCampaignStats(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID campaignId
    ) {
        return ResponseEntity.ok(adminNotificationService.getCampaignStats(principal, campaignId));
    }

    @GetMapping("/campaigns")
    @Operation(summary = "Storico campagne notifiche admin")
    public ResponseEntity<Page<AdminNotificationCampaignSummaryResponse>> getCampaignHistory(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String title,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "CREATED_AT") String sortBy,
        @RequestParam(defaultValue = "DESC") String direction
    ) {
        return ResponseEntity.ok(
            adminNotificationService.getCampaignHistory(
                principal,
                title,
                from,
                to,
                page,
                size,
                sortBy,
                direction
            )
        );
    }
}
