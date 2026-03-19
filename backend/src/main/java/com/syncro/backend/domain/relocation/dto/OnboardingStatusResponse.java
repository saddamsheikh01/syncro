package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;

public record OnboardingStatusResponse(
        String status,
        Integer completedSteps,
        Integer completionPercent,
        String userType,
        boolean hasActiveSnapshot,
        Integer latestSnapshotVersion,
        Instant updatedAt
) {}
