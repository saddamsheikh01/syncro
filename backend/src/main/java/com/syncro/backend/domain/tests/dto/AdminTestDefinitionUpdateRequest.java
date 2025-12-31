package com.syncro.backend.domain.tests.dto;

public record AdminTestDefinitionUpdateRequest(
    String title,
    String description,
    Boolean active
) {
}
