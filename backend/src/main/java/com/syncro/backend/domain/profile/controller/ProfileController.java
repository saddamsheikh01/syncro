package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserProfileRequest;
import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.service.UserProfileService;
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
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final UserProfileService profileService;

    public ProfileController(UserProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(profileService.getProfile(principal));
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> upsertProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UserProfileRequest request
    ) {
        return ResponseEntity.ok(profileService.upsertProfile(principal, request));
    }
}
