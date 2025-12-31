package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminTestAnswerOptionRequest(
    @NotBlank String label,
    @NotNull Integer weight
) {
}
