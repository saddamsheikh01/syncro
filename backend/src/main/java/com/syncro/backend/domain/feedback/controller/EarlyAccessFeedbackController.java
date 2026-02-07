package com.syncro.backend.domain.feedback.controller;

import com.syncro.backend.domain.feedback.dto.EarlyAccessFeedbackRequest;
import com.syncro.backend.domain.feedback.service.EarlyAccessFeedbackService;
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
@RequestMapping("/api/v1/feedback")
@Tag(name = "Feedback", description = "Feedback utenti early access")
@SecurityRequirement(name = "bearer-jwt")
public class EarlyAccessFeedbackController {

    private final EarlyAccessFeedbackService earlyAccessFeedbackService;

    public EarlyAccessFeedbackController(EarlyAccessFeedbackService earlyAccessFeedbackService) {
        this.earlyAccessFeedbackService = earlyAccessFeedbackService;
    }

    @PostMapping("/early-access")
    @Operation(summary = "Salva feedback early access")
    public ResponseEntity<Void> submitEarlyAccessFeedback(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody EarlyAccessFeedbackRequest request
    ) {
        earlyAccessFeedbackService.submit(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
