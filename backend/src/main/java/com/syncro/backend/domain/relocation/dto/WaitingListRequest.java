package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WaitingListRequest(
        @NotBlank @Email @Size(max = 255)
        String email,

        @NotBlank @Size(max = 255)
        String cityName
) {}
