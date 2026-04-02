package com.syncro.backend.domain.relocation.dto;

import java.util.Map;

public record AdminBudgetStatsResponse(
    long total,
    long anonymous,
    long registered,
    long last24h,
    String topCity,
    Map<String, Long> byPlan
) {}
