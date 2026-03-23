package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MicroTestNextResponse(
    UUID assignmentId,
    UUID testId,
    String testTitle,
    String testDescription,
    String status,
    Instant availableFrom,
    Instant expiresAt,
    Integer blockNumber,
    Integer totalBlocks,
    Integer completionPercent,
    List<MicroTestQuestionResponse> questions
) {}
