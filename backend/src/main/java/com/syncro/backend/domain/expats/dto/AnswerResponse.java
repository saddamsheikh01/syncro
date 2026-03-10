package com.syncro.backend.domain.expats.dto;

import java.time.Instant;
import java.util.UUID;

public record AnswerResponse(
        UUID id,
        Integer stepNumber,
        String questionGroup,
        String questionKey,
        Object answerValue,
        Instant answeredAt,
        Integer version
) {}
