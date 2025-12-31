package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record TestAnswerRequest(
    @NotNull UUID questionId,
    @NotNull UUID answerOptionId
) {
}
