package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ComputeScoringRequest(
        UUID targetCityId,

        @Size(max = 30)
        String analysisType
) {}
