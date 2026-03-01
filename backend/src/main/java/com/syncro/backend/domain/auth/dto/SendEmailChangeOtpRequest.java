package com.syncro.backend.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendEmailChangeOtpRequest(
    @NotBlank @Email @Size(max = 320) String newEmail
) {
}
