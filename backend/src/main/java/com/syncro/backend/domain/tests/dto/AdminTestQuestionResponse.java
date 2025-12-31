package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record AdminTestQuestionResponse(
    UUID id,
    UUID testId,
    String question,
    int position
) {
}
