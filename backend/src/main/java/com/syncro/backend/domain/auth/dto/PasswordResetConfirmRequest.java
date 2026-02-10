package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
    @NotBlank @Size(min = 32, max = 512) String token,
    @NotBlank @Size(min = 8, max = 128) String newPassword
) {
}
