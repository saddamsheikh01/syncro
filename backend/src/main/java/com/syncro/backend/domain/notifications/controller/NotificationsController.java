package com.syncro.backend.domain.notifications.controller;

import com.syncro.backend.domain.notifications.dto.NotificationResponse;
import com.syncro.backend.domain.notifications.dto.UnreadCountResponse;
import com.syncro.backend.domain.notifications.service.NotificationService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "Notifiche utente")
@SecurityRequirement(name = "bearer-jwt")
public class NotificationsController {

    private final NotificationService notificationService;

    public NotificationsController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Lista notifiche")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "false") boolean unreadOnly,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(principal, unreadOnly, page, size));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Conteggio notifiche non lette")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.getUnreadCount(principal));
    }

    @PatchMapping("/{notificationId}/read")
    @Operation(summary = "Segna notifica come letta")
    public ResponseEntity<NotificationResponse> markAsRead(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID notificationId
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(principal, notificationId));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Segna tutte le notifiche come lette")
    public ResponseEntity<Void> markAllAsRead(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAllAsRead(principal);
        return ResponseEntity.noContent().build();
    }
}
