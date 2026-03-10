package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ScoringConfigResponse(
        UUID id,
        String configKey,
        Map<String, Object> thresholds,
        Map<String, Object> budgetMarginThresholds,
        Map<String, Object> budgetPenaltyThresholds,
        Map<String, Object> lifestyleMultipliers,
        Map<String, Object> priorityThresholds,
        Map<String, Object> cityPerformanceThresholds,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {}
