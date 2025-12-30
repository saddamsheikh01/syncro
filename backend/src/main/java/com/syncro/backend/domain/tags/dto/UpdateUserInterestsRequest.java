package com.syncro.backend.domain.tags.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record UpdateUserInterestsRequest(
    @NotNull List<@NotNull UUID> tagIds
) {
}
