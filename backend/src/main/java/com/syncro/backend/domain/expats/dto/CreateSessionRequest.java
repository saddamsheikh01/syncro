package com.syncro.backend.domain.expats.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record CreateSessionRequest(
        @NotNull(message = "metadata e' obbligatorio")
        Map<String, Object> metadata
) {}
