package com.syncro.backend.domain.analytics.dto;

public record AnalyticsBatchResponse(
    int accepted,
    int duplicates,
    int rejected
) {
}
