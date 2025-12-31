package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record TestAnswerOptionResponse(
    UUID id,
    String label
) {
}
