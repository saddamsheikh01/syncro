package com.syncro.backend.domain.backoffice.dto;

import com.syncro.backend.domain.auth.entity.UserStatus;
import jakarta.validation.constraints.Pattern;

public record AdminUpdateUserRequest(
    @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Lingua non valida") String language,
    Boolean onboardingCompleted,
    UserStatus status
) {
}
