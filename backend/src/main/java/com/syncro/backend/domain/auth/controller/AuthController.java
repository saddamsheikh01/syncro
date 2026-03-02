package com.syncro.backend.domain.auth.controller;

import com.syncro.backend.domain.auth.dto.AuthResponse;
import com.syncro.backend.domain.auth.dto.GoogleAuthRequest;
import com.syncro.backend.domain.auth.dto.LoginRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetConfirmRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequestResponse;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.RegisterRequest;
import com.syncro.backend.domain.auth.dto.RegisterResponse;
import com.syncro.backend.domain.auth.dto.LoginResponse;
import com.syncro.backend.domain.auth.dto.SendEmailVerificationOtpRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.dto.UserAdminAccessResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.dto.VerifyEmailOtpRequest;
import com.syncro.backend.domain.auth.service.AuthService;
import com.syncro.backend.domain.auth.service.EmailVerificationService;
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
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user")
    public ResponseEntity<RegisterResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        RegisterResponse response = authService.register(
            request,
            httpRequest != null ? httpRequest.getRemoteAddr() : null,
            httpRequest != null ? httpRequest.getHeader("User-Agent") : null
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        LoginResponse response = authService.login(
            request,
            httpRequest != null ? httpRequest.getRemoteAddr() : null,
            httpRequest != null ? httpRequest.getHeader("User-Agent") : null
        );
        if (response.requiresVerification() != null) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    @Operation(summary = "Login/Register with Google")
    public ResponseEntity<AuthResponse> google(
        @Valid @RequestBody GoogleAuthRequest request,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.loginWithGoogle(
            request,
            httpRequest != null ? httpRequest.getRemoteAddr() : null,
            httpRequest != null ? httpRequest.getHeader("User-Agent") : null
        ));
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

    @PostMapping("/email-verification/send-otp")
    @Operation(summary = "Send email verification OTP")
    public ResponseEntity<Void> sendEmailVerificationOtp(
        @Valid @RequestBody SendEmailVerificationOtpRequest request
    ) {
        emailVerificationService.sendOtp(request.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/email-verification/verify")
    @Operation(summary = "Verify email with OTP")
    public ResponseEntity<AuthResponse> verifyEmailOtp(
        @Valid @RequestBody VerifyEmailOtpRequest request
    ) {
        emailVerificationService.verifyOtp(request.email(), request.otp());
        return ResponseEntity.ok(authService.loginAfterEmailVerification(request.email()));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getMe(principal));
    }

    @GetMapping("/admin-access")
    @Operation(summary = "Check if current user has SUPER_ADMIN admin access")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UserAdminAccessResponse> adminAccess(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(authService.getAdminAccess(principal));
    }
}
