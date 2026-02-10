package com.syncro.backend.domain.auth.controller;

import com.syncro.backend.domain.auth.dto.UpdateUserRequest;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.dto.UsernameAvailabilityResponse;
import com.syncro.backend.domain.auth.dto.ChangePasswordRequest;
import com.syncro.backend.domain.auth.dto.DeleteUserRequest;
import com.syncro.backend.domain.auth.service.UserService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
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

    @PatchMapping("/me")
    @Operation(summary = "Update current user")
    public ResponseEntity<UserResponse> updateMe(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.updateMe(principal, request));
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

    @PatchMapping("/me/password")
    @Operation(summary = "Change current user password")
    public ResponseEntity<Void> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(principal, request);
        return ResponseEntity.noContent().build();
    }
}
