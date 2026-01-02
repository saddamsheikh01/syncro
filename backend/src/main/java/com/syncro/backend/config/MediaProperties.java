package com.syncro.backend.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.media")
public record MediaProperties(
    @NotBlank String storageDir,
    @NotBlank String baseUrl
) {
}
