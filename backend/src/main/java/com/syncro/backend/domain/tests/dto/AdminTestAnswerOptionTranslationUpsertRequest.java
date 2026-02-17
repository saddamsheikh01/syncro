package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AdminTestAnswerOptionTranslationUpsertRequest(
    @NotNull UUID optionId,
    @NotBlank String label
) {
}
