package com.syncro.backend.domain.relocation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OnboardingResponse(
        UUID id,
        String userType,
        String targetCityName,
        String targetCountry,
        UUID targetCityId,
        UUID currentCityId,
        String currentCityName,
        String household,
        Boolean hasPets,
        String childrenAgeRange,
        BigDecimal monthlyBudget,
        String primaryGoal,
        String socialPriority,
        String desiredLifestyle,
        String workStatus,
        Boolean isRemote,
        String priorityProblem,
        String freeNotes,
        Integer completedSteps,
        Integer completionPercent,
        String status,
        Instant createdAt,
        Instant updatedAt
) {}
