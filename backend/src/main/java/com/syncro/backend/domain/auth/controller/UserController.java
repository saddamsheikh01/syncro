package com.syncro.backend.domain.auth.controller;

import com.syncro.backend.domain.auth.dto.UpdateUserRequest;
import com.syncro.backend.domain.auth.dto.UpdateUserResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.dto.UsernameAvailabilityResponse;
import com.syncro.backend.domain.auth.dto.DeleteUserRequest;
import com.syncro.backend.domain.auth.dto.SendEmailChangeOtpRequest;
import com.syncro.backend.domain.auth.dto.VerifyEmailChangeOtpRequest;
import com.syncro.backend.domain.auth.service.UserService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User profile access")
@SecurityRequirement(name = "bearer-jwt")
@Validated
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getMe(principal));
    }

    @PostMapping("/me/dashboard-visit")
    @Operation(summary = "Record dashboard visit (triggers welcome email on first visit)")
    public ResponseEntity<Void> recordDashboardVisit(@AuthenticationPrincipal UserPrincipal principal) {
        userService.recordDashboardVisit(principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/activity")
    @Operation(summary = "Record activity ping (updates lastActiveAt for NEW_MESSAGE_OFFLINE logic)")
    public ResponseEntity<Void> recordActivity(@AuthenticationPrincipal UserPrincipal principal) {
        userService.recordActivity(principal.userId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/email-change/send-otp")
    @Operation(summary = "Send OTP for email change (authenticated)")
    public ResponseEntity<Void> sendEmailChangeOtp(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody SendEmailChangeOtpRequest request
    ) {
        userService.sendEmailChangeOtp(principal, request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/me/email-change/verify")
    @Operation(summary = "Verify OTP and complete email change (authenticated)")
    public ResponseEntity<UserResponse> verifyEmailChange(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody VerifyEmailChangeOtpRequest request
    ) {
        return ResponseEntity.ok(userService.verifyEmailChangeOtp(principal, request));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user")
    public ResponseEntity<UpdateUserResponse> updateMe(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        UpdateUserResponse response = userService.updateMe(principal, request);
        if (response.requiresVerification() != null) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/username-availability")
    @Operation(summary = "Check username availability")
    public ResponseEntity<UsernameAvailabilityResponse> checkUsernameAvailability(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam("username")
        @Pattern(regexp = "^[a-z0-9]{3,30}$", message = "Username non valido")
        String username
    ) {
        return ResponseEntity.ok(userService.checkUsernameAvailability(principal, username));
    }

    @PostMapping("/me/delete")
    @Operation(summary = "Delete current user profile")
    public ResponseEntity<Void> deleteMe(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody DeleteUserRequest request
    ) {
        userService.deleteMe(principal, request);
        return ResponseEntity.noContent().build();
    }
}
