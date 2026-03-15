package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateBudgetTrackingRequest(
    @NotBlank String category,
    BigDecimal expectedValue,
    BigDecimal actualValue,
    BigDecimal threshold,
    UUID simulationId
) {}
