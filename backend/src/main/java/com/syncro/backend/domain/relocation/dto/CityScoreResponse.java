package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record CityScoreResponse(
        UUID id,
        UUID snapshotId,
        UUID cityId,
        String cityName,
        String country,
        String analysisType,
        Integer scoreTotal,
        String compatibilityLevel,
        Map<String, Object> breakdown,
        Map<String, Object> userWeights,
        Map<String, Object> userPriorityClassification,
        Map<String, Object> radarValues,
        Map<String, Object> budgetCheck,
        Map<String, Object> integrationBreakdown,
        Map<String, Object> insights,
        String algorithmVersion,
        Integer rankingPosition,
        Instant computedAt
) {}
