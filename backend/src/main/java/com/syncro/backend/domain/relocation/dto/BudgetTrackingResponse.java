package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetTrackingResponse(
    UUID id,
    UUID simulationId,
    String category,
    BigDecimal expectedValue,
    BigDecimal actualValue,
    BigDecimal delta,
    BigDecimal threshold,
    String alertStatus,
    Instant recordedAt,
    Instant createdAt
) {}
