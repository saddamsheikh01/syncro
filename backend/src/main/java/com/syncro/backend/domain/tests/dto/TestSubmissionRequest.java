package com.syncro.backend.domain.tests.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TestSubmissionRequest(
    @NotNull List<@Valid TestAnswerRequest> answers
) {
}
