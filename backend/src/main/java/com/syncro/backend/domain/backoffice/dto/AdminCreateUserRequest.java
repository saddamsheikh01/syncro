package com.syncro.backend.domain.backoffice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminCreateUserRequest(
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(min = 8, max = 128) String password,
    @Pattern(regexp = "^[A-Za-z-]{2,10}$", message = "Lingua non valida") String language
) {
}
