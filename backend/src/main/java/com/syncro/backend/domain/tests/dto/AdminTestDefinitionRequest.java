package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record AdminTestDefinitionRequest(
    @NotBlank String title,
    String description,
    Boolean active,
    TestType testType,
    TestScoringStrategy scoringStrategy,
    Map<String, Object> config
) {
}
