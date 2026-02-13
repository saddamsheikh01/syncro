package com.syncro.backend.domain.referrals.controller;

import com.syncro.backend.domain.referrals.dto.AdminReferralCodeResponse;
import com.syncro.backend.domain.referrals.dto.AdminReferralDetailResponse;
import com.syncro.backend.domain.referrals.dto.AdminReferralUsageResponse;
import com.syncro.backend.domain.referrals.service.ReferralService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/referrals")
@Tag(name = "Admin Referrals", description = "Backoffice referral")
@SecurityRequirement(name = "bearer-jwt")
public class AdminReferralsController {

    private final ReferralService referralService;

    public AdminReferralsController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping
    @Operation(summary = "Lista referral")
    public ResponseEntity<Page<AdminReferralCodeResponse>> getReferralCodes(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(referralService.getReferralCodes(principal, q, page, size));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Dettaglio referral")
    public ResponseEntity<AdminReferralDetailResponse> getReferralDetail(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable String code
    ) {
        return ResponseEntity.ok(referralService.getReferralDetail(principal, code));
    }

    @GetMapping("/{code}/usages")
    @Operation(summary = "Dettaglio utilizzi referral")
    public ResponseEntity<Page<AdminReferralUsageResponse>> getReferralUsages(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable String code,
        @RequestParam(defaultValue = "false") boolean includeProgress,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(
            referralService.getReferralUsages(principal, code, includeProgress, page, size)
        );
    }
}
