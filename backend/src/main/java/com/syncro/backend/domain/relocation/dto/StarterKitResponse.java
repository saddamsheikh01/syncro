package com.syncro.backend.domain.relocation.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record StarterKitResponse(
    UUID id,
    UUID cityId,
    String scenario,
    String planCode,
    Map<String, Object> payload,
    List<StarterKitActionResponse> actions,
    Instant createdAt
) {}
