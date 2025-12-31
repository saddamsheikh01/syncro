package com.syncro.backend.domain.tests.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminTestDefinitionRequest(
    @NotBlank String title,
    String description,
    Boolean active
) {
}
