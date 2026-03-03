package com.syncro.backend.domain.backoffice.dto;

public record AdminOnboardingBackfillResponse(
    long totalUsers,
    long completedBefore,
    long completedAfter,
    int updatedUsers
) {
}
