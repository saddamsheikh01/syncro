package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Invalid language") String language,
        Boolean onboardingCompleted,
        @Pattern(regexp = "^[a-z0-9]{3,30}$", message = "Invalid username") String username,
        @Size(max = 32, message = "Invalid phone number") String phone,
        @Email(message = "Invalid email") @Size(max = 320) String email
) {
}