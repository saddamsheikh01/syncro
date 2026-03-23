package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record MicroTestSubmitRequest(
    @NotEmpty List<MicroTestAnswerRequest> answers
) {
    public record MicroTestAnswerRequest(
        UUID questionId,
        UUID answerOptionId
    ) {}
}
