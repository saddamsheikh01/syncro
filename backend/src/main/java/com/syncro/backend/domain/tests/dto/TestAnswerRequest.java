package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record TestAnswerRequest(
    @NotNull UUID questionId,
    @NotNull List<UUID> answerOptionIds
) {
}
