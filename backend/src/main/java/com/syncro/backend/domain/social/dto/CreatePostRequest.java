package com.syncro.backend.domain.social.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record CreatePostRequest(
    @NotBlank String content,
    String language,
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0") Double latitude,
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0") Double longitude
) {
}
