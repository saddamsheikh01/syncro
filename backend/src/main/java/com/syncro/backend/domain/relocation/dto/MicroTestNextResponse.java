package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.UUID;

public record MicroTestNextResponse(
    UUID assignmentId,
    UUID testId,
    String testTitle,
    String testDescription,
    String status,
    Instant availableFrom,
    Instant expiresAt
) {}
