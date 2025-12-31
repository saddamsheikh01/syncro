package com.syncro.backend.domain.tests.dto;

import java.util.UUID;

public record TestSummaryResponse(
    UUID id,
    String title,
    String description
) {
}
