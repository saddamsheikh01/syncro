package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;
import java.util.UUID;

public record ZyraTestRecapResponse(
    UUID submissionId,
    String testTitle,
    String testType,
    String recap,
    Instant generatedAt
) {
}
