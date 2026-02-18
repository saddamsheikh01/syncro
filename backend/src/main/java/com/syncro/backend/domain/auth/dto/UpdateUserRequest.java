package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Lingua non valida") String language,
        Boolean onboardingCompleted,
        @Pattern(regexp = "^[a-z0-9]{3,30}$", message = "Username non valido") String username,
        @Size(max = 32, message = "Telefono non valido") String phone,
        @Email(message = "Email non valida") @Size(max = 320) String email
) {
}