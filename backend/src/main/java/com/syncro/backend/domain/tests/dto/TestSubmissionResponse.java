package com.syncro.backend.domain.tests.dto;

import java.time.Instant;
import java.util.UUID;

public record TestSubmissionResponse(
    UUID submissionId,
    UUID testId,
    Instant submittedAt
) {
}
