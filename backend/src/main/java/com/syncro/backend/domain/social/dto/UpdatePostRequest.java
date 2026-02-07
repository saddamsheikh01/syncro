package com.syncro.backend.domain.social.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdatePostRequest(
    @NotBlank String content
) {
}
