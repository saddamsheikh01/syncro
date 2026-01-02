package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record AdminPlaceRequest(
    @NotBlank String name,
    String description,
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0") Double latitude,
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0") Double longitude,
    UUID categoryId,
    CatalogSource source,
    List<UUID> tagIds
) {
}
