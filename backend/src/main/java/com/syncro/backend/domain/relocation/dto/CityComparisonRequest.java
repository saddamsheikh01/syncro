package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CityComparisonRequest(
        @NotNull(message = "currentCityId is required")
        UUID currentCityId,

        @NotNull(message = "targetCityId is required")
        UUID targetCityId
) {}
