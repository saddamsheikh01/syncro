package com.syncro.backend.domain.expats.dto;

import jakarta.validation.constraints.NotBlank;

public record ConvertSessionRequest(
        @NotBlank
        String sessionToken
) {}
