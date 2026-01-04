package com.syncro.backend.domain.analytics.dto;

import java.time.Instant;

public record KpiPoint(
    Instant bucket,
    long value
) {
}
