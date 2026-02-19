package com.syncro.backend.domain.support.controller;

import com.syncro.backend.domain.support.dto.SupportMessageRequest;
import com.syncro.backend.domain.support.service.SupportService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/support")
@Tag(name = "Support", description = "User support messages to the team")
@SecurityRequirement(name = "bearer-jwt")
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping
    @Operation(summary = "Send a support message to the team")
    public ResponseEntity<Void> submit(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody SupportMessageRequest request
    ) {
        supportService.submit(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
