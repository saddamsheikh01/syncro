package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GoogleAuthRequest(
    @NotBlank @Size(max = 4096) String idToken,
    @Size(max = 32) String refCode,
    @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Lingua non valida") String language
) {
}
