package com.syncro.backend.domain.tests.dto;

import java.util.List;
import java.util.UUID;

public record AdminTestTranslationResponse(
    UUID testId,
    String locale,
    String title,
    String description,
    List<AdminTestQuestionTranslationResponse> questions
) {
}
