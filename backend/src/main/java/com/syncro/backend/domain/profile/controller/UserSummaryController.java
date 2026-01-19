package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.service.UserProfileService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Accesso ai profili utente")
@SecurityRequirement(name = "bearer-jwt")
public class UserSummaryController {

    private final UserProfileService userProfileService;

    public UserSummaryController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/{userId}/summary")
    @Operation(summary = "Dettaglio sintetico di un utente")
    public ResponseEntity<UserSummaryResponse> getUserSummary(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(userProfileService.getUserSummary(principal, userId));
    }
}
