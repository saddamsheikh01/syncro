package com.syncro.backend.domain.tests.dto;

import java.util.List;
import java.util.UUID;

public record TestDetailResponse(
    UUID id,
    String title,
    String description,
    List<TestQuestionResponse> questions
) {
}
