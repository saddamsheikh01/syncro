package com.syncro.backend.domain.tests.dto;

import java.util.List;

public record TestListResponse(
    List<TestSummaryResponse> tests
) {
}
