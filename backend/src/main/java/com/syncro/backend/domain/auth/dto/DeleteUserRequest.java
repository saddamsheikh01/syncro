package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteUserRequest(
    @NotBlank(message = "Frase di conferma obbligatoria")
    @Size(max = 64, message = "Frase di conferma non valida")
    String confirmationPhrase
) {
}
