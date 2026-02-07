package com.syncro.backend.domain.feedback.dto;

import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedbackChoice;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record EarlyAccessFeedbackRequest(
    @NotNull EarlyAccessFeedbackChoice choice,
    @Size(max = 120) String message,
    @PositiveOrZero Integer activeSecondsBeforePrompt
) {
}
