package com.syncro.backend.domain.tests.dto;

import java.util.List;
import java.util.UUID;

public record AdminTestQuestionTranslationResponse(
    UUID questionId,
    String questionText,
    List<AdminTestAnswerOptionTranslationResponse> options
) {
}
