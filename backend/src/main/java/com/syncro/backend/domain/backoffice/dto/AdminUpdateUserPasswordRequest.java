package com.syncro.backend.domain.backoffice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUpdateUserPasswordRequest(
    @NotBlank @Size(min = 8, max = 128) String newPassword
) {
}
