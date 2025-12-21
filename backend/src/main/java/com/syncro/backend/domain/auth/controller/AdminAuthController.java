package com.syncro.backend.domain.auth.controller;

import com.syncro.backend.domain.auth.dto.AdminAuthResponse;
import com.syncro.backend.domain.auth.dto.AdminLoginRequest;
import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.service.AdminAuthService;
import com.syncro.backend.security.AdminPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/admin")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/login")
    public ResponseEntity<AdminAuthResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(adminAuthService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(adminAuthService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AdminUserResponse> me(@AuthenticationPrincipal AdminPrincipal principal) {
        return ResponseEntity.ok(adminAuthService.getMe(principal));
    }
}
