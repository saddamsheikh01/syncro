package com.syncro.backend.domain.email.controller;

import com.syncro.backend.domain.email.dto.UpdateUserEmailPreferenceRequest;
import com.syncro.backend.domain.email.dto.UserEmailPreferenceResponse;
import com.syncro.backend.domain.email.entity.UserEmailPreference;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.email.service.EmailPreferencesService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/email-preferences")
@Tag(name = "Email preferences", description = "Toggle and settings for email notifications")
@SecurityRequirement(name = "bearer-jwt")
public class EmailPreferencesController {

    private final EmailNotificationService emailNotificationService;
    private final EmailPreferencesService emailPreferencesService;

    public EmailPreferencesController(
        EmailNotificationService emailNotificationService,
        EmailPreferencesService emailPreferencesService
    ) {
        this.emailNotificationService = emailNotificationService;
        this.emailPreferencesService = emailPreferencesService;
    }

    @GetMapping
    @Operation(summary = "Get my email notification preferences")
    public ResponseEntity<UserEmailPreferenceResponse> getMyPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        UserEmailPreference prefs = emailNotificationService.getOrCreatePreferences(principal.userId());
        return ResponseEntity.ok(toResponse(prefs));
    }

    @PatchMapping
    @Operation(summary = "Update my email notification preferences")
    public ResponseEntity<UserEmailPreferenceResponse> updateMyPreferences(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserEmailPreferenceRequest request
    ) {
        if (principal == null) return ResponseEntity.status(401).build();
        UserEmailPreference prefs = emailPreferencesService.update(principal.userId(), request);
        return ResponseEntity.ok(toResponse(prefs));
    }

    private static UserEmailPreferenceResponse toResponse(UserEmailPreference p) {
        return new UserEmailPreferenceResponse(
            p.getUserId(),
            p.isChatEnabled(),
            p.isConnectionsEnabled(),
            p.isMatchEnabled(),
            p.isEventsEnabled(),
            p.isDigestEnabled(),
            p.isContentWeeklyDigest(),
            p.getChatMinMinutesBetween(),
            p.isSecurityEnabled(),
            p.isTestsProfileEnabled(),
            p.isFeedMomentsEnabled()
        );
    }
}
