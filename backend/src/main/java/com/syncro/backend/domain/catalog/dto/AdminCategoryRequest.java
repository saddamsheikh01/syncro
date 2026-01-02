package com.syncro.backend.domain.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminCategoryRequest(
    @NotBlank String name
) {
}
