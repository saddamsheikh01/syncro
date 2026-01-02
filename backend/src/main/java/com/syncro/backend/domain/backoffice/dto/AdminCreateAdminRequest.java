package com.syncro.backend.domain.backoffice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminCreateAdminRequest(
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(min = 8, max = 128) String password
) {
}
