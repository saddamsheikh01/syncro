package com.syncro.backend.domain.tests.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminTestDetailResponse(
    UUID id,
    String title,
    String description,
    boolean active,
    Instant createdAt,
    Instant updatedAt,
    List<AdminTestQuestionDetailResponse> questions
) {
}
