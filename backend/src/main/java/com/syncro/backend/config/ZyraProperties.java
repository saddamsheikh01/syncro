package com.syncro.backend.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.zyra")
public record ZyraProperties(
    @NotNull ZyraProvider provider,
    @NotBlank String baseUrl,
    @NotBlank String model,
    String apiKey,
    @Positive int maxHistory,
    @Positive int profileRecapCacheTtlMinutes,
    @Positive int placeRecapCacheTtlMinutes,
    @Positive int chatRecapCacheTtlMinutes,
    @Positive int recapCacheMaxEntries
) {
}
