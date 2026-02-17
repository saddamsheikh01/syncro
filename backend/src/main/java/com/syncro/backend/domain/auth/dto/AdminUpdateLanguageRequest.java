package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.Pattern;

public record AdminUpdateLanguageRequest(
    @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Lingua non valida") String language
) {
}
