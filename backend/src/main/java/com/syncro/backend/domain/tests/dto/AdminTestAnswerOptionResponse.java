package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record AdminTestAnswerOptionResponse(
    UUID id,
    UUID questionId,
    String label,
    int weight
) {
}
