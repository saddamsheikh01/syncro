package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestQuestionType;
import java.util.UUID;

public record AdminTestQuestionResponse(
    UUID id,
    UUID testId,
    String question,
    int position,
    TestQuestionType questionType,
    boolean required,
    Integer maxSelections
) {
}
