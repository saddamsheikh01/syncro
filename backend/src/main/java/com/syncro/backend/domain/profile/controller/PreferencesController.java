package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserPreferencesRequest;
import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.service.UserPreferenceService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/preferences")
@Tag(name = "Preferences", description = "User preferences")
@SecurityRequirement(name = "bearer-jwt")
public class PreferencesController {

    private final UserPreferenceService preferenceService;

    public PreferencesController(UserPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    @Operation(summary = "Get preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(preferenceService.getPreferences(principal));
    }

    @PutMapping
    @Operation(summary = "Create or update preferences")
    public ResponseEntity<UserPreferencesResponse> upsertPreferences(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UserPreferencesRequest request
    ) {
        return ResponseEntity.ok(preferenceService.upsertPreferences(principal, request));
    }
}
