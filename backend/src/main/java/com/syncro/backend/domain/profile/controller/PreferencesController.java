package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserPreferencesRequest;
import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.service.UserPreferenceService;
import com.syncro.backend.security.UserPrincipal;
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
public class PreferencesController {

    private final UserPreferenceService preferenceService;

    public PreferencesController(UserPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<UserPreferencesResponse> getPreferences(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(preferenceService.getPreferences(principal));
    }

    @PutMapping
    public ResponseEntity<UserPreferencesResponse> upsertPreferences(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UserPreferencesRequest request
    ) {
        return ResponseEntity.ok(preferenceService.upsertPreferences(principal, request));
    }
}
