package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import java.util.Map;

public record AdminTestDefinitionUpdateRequest(
    String title,
    String description,
    Boolean active,
    TestType testType,
    TestScoringStrategy scoringStrategy,
    Map<String, Object> config
) {
}
