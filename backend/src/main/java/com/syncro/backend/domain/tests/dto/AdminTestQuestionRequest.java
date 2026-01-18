package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestQuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AdminTestQuestionRequest(
    @NotBlank String question,
    @NotNull @Positive Integer position,
    TestQuestionType questionType,
    Boolean required,
    Integer maxSelections
) {
}
