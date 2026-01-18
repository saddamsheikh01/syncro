package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AdminTestDefinitionResponse(
    UUID id,
    String title,
    String description,
    boolean active,
    TestType testType,
    TestScoringStrategy scoringStrategy,
    Map<String, Object> config,
    Instant createdAt,
    Instant updatedAt
) {
}
