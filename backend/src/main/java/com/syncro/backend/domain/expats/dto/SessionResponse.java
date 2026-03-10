package com.syncro.backend.domain.expats.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String sessionToken,
        String status,
        Integer currentStep,
        Integer totalSteps,
        String userType,
        Instant expiresAt,
        Instant lastSeenAt,
        List<AnswerResponse> answers
) {}
