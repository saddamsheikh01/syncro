package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.Positive;

public record AdminTestQuestionUpdateRequest(
    String question,
    @Positive Integer position
) {
}
