package com.syncro.backend.domain.expats.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateSessionRequest(
        @NotNull @Min(1) @Max(10)
        Integer stepNumber,

        @NotBlank
        String questionGroup,

        @NotBlank
        String questionKey,

        @NotNull
        Object answerValue
) {}
