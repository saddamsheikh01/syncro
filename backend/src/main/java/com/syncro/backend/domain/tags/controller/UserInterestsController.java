package com.syncro.backend.domain.tags.controller;

import com.syncro.backend.domain.tags.dto.UpdateUserInterestsRequest;
import com.syncro.backend.domain.tags.dto.UserInterestsResponse;
import com.syncro.backend.domain.tags.service.UserInterestService;
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
@RequestMapping("/api/v1/users/me/interests")
@Tag(name = "Interests", description = "Interessi utente")
@SecurityRequirement(name = "bearer-jwt")
public class UserInterestsController {

    private final UserInterestService interestService;

    public UserInterestsController(UserInterestService interestService) {
        this.interestService = interestService;
    }

    @GetMapping
    @Operation(summary = "Lista interessi utente")
    public ResponseEntity<UserInterestsResponse> getInterests(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(interestService.getInterests(principal));
    }

    @PutMapping
    @Operation(summary = "Aggiorna interessi utente")
    public ResponseEntity<UserInterestsResponse> updateInterests(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserInterestsRequest request
    ) {
        return ResponseEntity.ok(interestService.updateInterests(principal, request));
    }
}
