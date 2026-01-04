package com.syncro.backend.domain.analytics.dto;

import com.syncro.backend.domain.analytics.entity.AnalyticsEventType;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record AnalyticsEventRequest(
    @NotNull AnalyticsEventType eventType,
    Map<String, Object> payload
) {
}
