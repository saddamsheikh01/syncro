package com.syncro.backend.domain.referrals.controller;

import com.syncro.backend.domain.referrals.dto.ReferralLinkResponse;
import com.syncro.backend.domain.referrals.service.ReferralService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/referrals")
@Tag(name = "Referrals", description = "Referral link utente")
@SecurityRequirement(name = "bearer-jwt")
public class ReferralsController {

    private final ReferralService referralService;

    public ReferralsController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping("/me")
    @Operation(summary = "Ottieni o crea il referral link personale")
    public ResponseEntity<ReferralLinkResponse> getMyReferral(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(referralService.getOrCreateMyReferral(principal));
    }
}
