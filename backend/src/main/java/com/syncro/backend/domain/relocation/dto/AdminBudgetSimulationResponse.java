package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AdminBudgetSimulationResponse(
    UUID id,
    String source,
    UUID userId,
    String userEmail,
    UUID sessionId,
    UUID cityId,
    String cityName,
    String planCode,
    BigDecimal estimatedMonthlyCost,
    BigDecimal monthlyBalance,
    String balanceStatus,
    Map<String, Object> inputPayload,
    Map<String, Object> outputPayload,
    String algorithmVersion,
    Instant createdAt
) {}
