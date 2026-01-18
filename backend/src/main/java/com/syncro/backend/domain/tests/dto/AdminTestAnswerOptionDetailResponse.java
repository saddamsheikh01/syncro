package com.syncro.backend.domain.tests.dto;

import java.util.Map;
import java.util.UUID;

public record AdminTestAnswerOptionDetailResponse(
    UUID id,
    String label,
    int weight,
    Map<String, Object> metadata
) {
}
