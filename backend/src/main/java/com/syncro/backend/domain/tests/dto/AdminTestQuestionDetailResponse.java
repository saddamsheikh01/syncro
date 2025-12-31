package com.syncro.backend.domain.tests.dto;

import java.util.List;
import java.util.UUID;

public record AdminTestQuestionDetailResponse(
    UUID id,
    String question,
    int position,
    List<AdminTestAnswerOptionDetailResponse> options
) {
}
