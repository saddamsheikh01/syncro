package com.syncro.backend.domain.tests.dto;

import com.syncro.backend.domain.tests.entity.TestType;
import java.util.UUID;

public record TestSummaryResponse(
    UUID id,
    String title,
    String description,
    TestType testType,
    boolean completed
) {
}
