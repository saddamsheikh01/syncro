package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestScoringStrategy;
import com.syncro.backend.domain.tests.entity.TestType;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record TestDetailResponse(
    UUID id,
    String title,
    String description,
    TestType testType,
    TestScoringStrategy scoringStrategy,
    Map<String, Object> config,
    List<TestQuestionResponse> questions
) {
}
