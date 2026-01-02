package com.syncro.backend.domain.zyra.dto;

import jakarta.validation.constraints.NotBlank;

public record ZyraMessageRequest(
    @NotBlank String content
) {
}
