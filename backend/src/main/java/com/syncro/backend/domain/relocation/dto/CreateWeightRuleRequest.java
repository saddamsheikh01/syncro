package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CreateWeightRuleRequest(
        @NotBlank @Size(max = 50)
        String questionKey,

        @NotBlank @Size(max = 50)
        String answerValue,

        @NotNull
        Map<String, Integer> weightAdjustments
) {}
