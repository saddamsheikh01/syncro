package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;

public record AdminExperienceRequest(
    @NotBlank String name,
    String description,
    UUID categoryId,
    UUID placeId,
    CatalogSource source,
    List<UUID> tagIds
) {
}
