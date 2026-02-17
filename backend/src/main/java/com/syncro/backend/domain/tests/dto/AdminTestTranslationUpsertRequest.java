package com.syncro.backend.domain.tests.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AdminTestTranslationUpsertRequest(
    @NotBlank String title,
    String description,
    @Valid @NotEmpty List<AdminTestQuestionTranslationUpsertRequest> questions
) {
}
