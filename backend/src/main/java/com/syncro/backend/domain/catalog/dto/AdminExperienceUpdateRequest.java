package com.syncro.backend.domain.catalog.dto;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import java.util.List;
import java.util.UUID;

public record AdminExperienceUpdateRequest(
    String name,
    String description,
    UUID categoryId,
    UUID placeId,
    CatalogSource source,
    List<UUID> tagIds
) {
}
