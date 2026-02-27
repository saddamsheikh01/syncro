package com.syncro.backend.domain.analytics.dto;

public record AnalyticsSegmentCountResponse(
    String label,
    long count
) {
}
