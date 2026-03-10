package com.syncro.backend.domain.expats.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record FunnelConfigResponse(
        UUID id,
        String configKey,
        String language,
        Integer version,
        Map<String, Object> content,
        Map<String, Object> featureFlags,
        Instant updatedAt
) {}
