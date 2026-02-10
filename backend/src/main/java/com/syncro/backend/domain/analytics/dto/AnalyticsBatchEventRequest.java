package com.syncro.backend.domain.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AnalyticsBatchEventRequest(
    UUID eventId,
    @NotBlank @Size(max = 120) String eventName,
    @NotNull @Positive Integer eventVersion,
    @Size(max = 128) String idempotencyKey,
    UUID sessionId,
    Instant occurredAt,
    @Size(max = 512) String route,
    @Size(max = 64) String platform,
    @Size(max = 64) String appVersion,
    @Size(max = 32) String eventSource,
    Boolean consentAnalytics,
    @Size(max = 512) String userAgent,
    Map<String, Object> payload
) {
}
