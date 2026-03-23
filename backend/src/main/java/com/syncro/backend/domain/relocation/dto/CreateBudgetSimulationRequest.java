package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateBudgetSimulationRequest(
    @NotBlank String planCode,
    UUID cityId,
    BigDecimal monthlyBudget,
    BigDecimal monthlyIncome,
    BigDecimal savings,
    String household,
    String livingType,
    String housingType,
    String location,
    String desiredLifestyle,
    Integer numberOfChildren,
    List<Integer> childrenAges,
    Boolean hasPet,
    String eatingOutFrequency,
    String transportMode,
    String leisureLevel,
    Integer projectionMonths
) {}
