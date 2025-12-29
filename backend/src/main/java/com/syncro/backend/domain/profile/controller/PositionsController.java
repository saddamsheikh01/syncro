package com.syncro.backend.domain.profile.controller;

import com.syncro.backend.domain.profile.dto.UserPositionRequest;
import com.syncro.backend.domain.profile.dto.UserPositionResponse;
import com.syncro.backend.domain.profile.service.UserPositionService;
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
@RequestMapping("/api/v1/positions")
@Tag(name = "Positions", description = "User position")
@SecurityRequirement(name = "bearer-jwt")
public class PositionsController {

    private final UserPositionService positionService;

    public PositionsController(UserPositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    @Operation(summary = "Get position")
    public ResponseEntity<UserPositionResponse> getPosition(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(positionService.getPosition(principal));
    }

    @PutMapping
    @Operation(summary = "Create or update position")
    public ResponseEntity<UserPositionResponse> upsertPosition(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UserPositionRequest request
    ) {
        return ResponseEntity.ok(positionService.upsertPosition(principal, request));
    }
}
