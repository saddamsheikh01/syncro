package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestQuestionType;
import java.util.List;
import java.util.UUID;

public record AdminTestQuestionDetailResponse(
    UUID id,
    String question,
    int position,
    TestQuestionType questionType,
    boolean required,
    Integer maxSelections,
    List<AdminTestAnswerOptionDetailResponse> options
) {
}
