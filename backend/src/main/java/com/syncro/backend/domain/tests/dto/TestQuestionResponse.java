package com.syncro.backend.domain.tests.dto;

import java.util.List;
import java.util.UUID;

public record TestQuestionResponse(
    UUID id,
    String question,
    int position,
    List<TestAnswerOptionResponse> options
) {
}
