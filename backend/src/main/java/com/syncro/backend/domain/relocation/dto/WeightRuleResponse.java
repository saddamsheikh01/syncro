package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record WeightRuleResponse(
        UUID id,
        String questionKey,
        String answerValue,
        Map<String, Integer> weightAdjustments,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
