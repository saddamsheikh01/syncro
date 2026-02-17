package com.syncro.backend.domain.tests.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record AdminTestQuestionTranslationUpsertRequest(
    @NotNull UUID questionId,
    @NotBlank String questionText,
    @Valid @NotEmpty List<AdminTestAnswerOptionTranslationUpsertRequest> options
) {
}
