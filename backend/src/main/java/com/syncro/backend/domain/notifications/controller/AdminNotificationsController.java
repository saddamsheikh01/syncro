package com.syncro.backend.domain.notifications.controller;

import com.syncro.backend.domain.notifications.dto.AdminCreateNotificationRequest;
import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.service.AdminNotificationService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
