package com.syncro.backend.domain.tests.dto;

import java.util.Map;
import java.util.UUID;

public record TestAnswerOptionResponse(
    UUID id,
    String label,
    Map<String, Object> metadata
) {
}
