package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteUserRequest(
    @NotBlank(message = "Confirmation phrase is required")
    @Size(max = 64, message = "Invalid confirmation phrase")
    String confirmationPhrase
) {
}
