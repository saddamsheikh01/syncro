package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record BudgetSimulationResponse(
    UUID id,
    UUID cityId,
    String cityName,
    String scenario,
    String planCode,
    String source,
    Map<String, Object> inputPayload,
    Map<String, Object> outputPayload,
    String algorithmVersion,
    Instant createdAt
) {}
