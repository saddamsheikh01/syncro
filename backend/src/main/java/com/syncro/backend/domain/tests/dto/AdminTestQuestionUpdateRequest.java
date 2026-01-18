package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestQuestionType;
import jakarta.validation.constraints.Positive;

public record AdminTestQuestionUpdateRequest(
    String question,
    @Positive Integer position,
    TestQuestionType questionType,
    Boolean required,
    Integer maxSelections
) {
}
