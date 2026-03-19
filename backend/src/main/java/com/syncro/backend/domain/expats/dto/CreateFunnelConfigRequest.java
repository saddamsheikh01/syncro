package com.syncro.backend.domain.expats.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateFunnelConfigRequest(
        @NotBlank @Size(max = 100)
        String configKey,

        @Size(max = 10)
        String language,

        @NotNull
        Map<String, Object> content,

        Map<String, Object> featureFlags,

        Boolean active
) {}
