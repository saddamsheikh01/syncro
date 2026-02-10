package com.syncro.backend.domain.auth.controller;

import com.syncro.backend.domain.auth.dto.AuthResponse;
import com.syncro.backend.domain.auth.dto.LoginRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetConfirmRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequestResponse;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.RegisterRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.service.AuthService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "User authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.register(
            request,
            httpRequest != null ? httpRequest.getRemoteAddr() : null,
            httpRequest != null ? httpRequest.getHeader("User-Agent") : null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/password/forgot")
    @Operation(summary = "Request password reset")
    public ResponseEntity<PasswordResetRequestResponse> requestPasswordReset(
        @Valid @RequestBody PasswordResetRequest request
    ) {
        return ResponseEntity.accepted().body(authService.requestPasswordReset(request));
    }

    @PostMapping("/password/reset")
    @Operation(summary = "Confirm password reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getMe(principal));
    }
}
