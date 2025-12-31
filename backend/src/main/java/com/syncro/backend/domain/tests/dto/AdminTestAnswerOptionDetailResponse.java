package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record AdminTestAnswerOptionDetailResponse(
    UUID id,
    String label,
    int weight
) {
}
