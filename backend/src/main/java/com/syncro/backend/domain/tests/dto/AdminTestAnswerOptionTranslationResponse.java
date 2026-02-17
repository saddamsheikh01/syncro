package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record AdminTestAnswerOptionTranslationResponse(
    UUID optionId,
    String label
) {
}
