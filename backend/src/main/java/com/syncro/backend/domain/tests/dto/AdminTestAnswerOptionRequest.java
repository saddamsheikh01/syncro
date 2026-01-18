package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record AdminTestAnswerOptionRequest(
    @NotBlank String label,
    @NotNull Integer weight,
    Map<String, Object> metadata
) {
}
