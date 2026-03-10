package com.syncro.backend.domain.relocation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateOnboardingRequest(
        @Size(max = 30)
        String userType,

        @Size(max = 255)
        String targetCityName,

        @Size(max = 100)
        String targetCountry,

        @Size(max = 30)
        String household,

        Boolean hasPets,

        @Size(max = 50)
        String childrenAgeRange,

        @DecimalMin("0.00")
        BigDecimal monthlyBudget,

        @Size(max = 50)
        String primaryGoal,

        @Size(max = 20)
        String socialPriority,

        @Size(max = 30)
        String desiredLifestyle,

        @Size(max = 30)
        String workStatus,

        Boolean isRemote,

        @Size(max = 50)
        String priorityProblem,

        String freeNotes,

        @Min(0) @Max(10)
        Integer completedSteps
) {}
