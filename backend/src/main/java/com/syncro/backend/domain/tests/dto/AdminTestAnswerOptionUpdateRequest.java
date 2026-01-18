package com.syncro.backend.domain.tests.dto;

import java.util.Map;

public record AdminTestAnswerOptionUpdateRequest(
    String label,
    Integer weight,
    Map<String, Object> metadata
) {
}
