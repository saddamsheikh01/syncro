package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record RiskSnapshotResponse(
    UUID id,
    String scenario,
    String sourceType,
    Map<String, Object> riskIndicators,
    Integer burnoutIndex,
    String overallRiskLevel,
    Instant createdAt
) {}
