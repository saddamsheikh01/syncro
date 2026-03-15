package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateBudgetSimulationRequest(
    @NotBlank String planCode,
    UUID cityId,
    BigDecimal monthlyBudget,
    String household,
    String desiredLifestyle,
    BigDecimal monthlyIncome,
    Integer projectionMonths
) {}
