package com.syncro.backend.domain.backoffice.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record AdminUpdateUserMatchmakingRequest(
    @NotNull(message = "matchmakingFilters e obbligatorio")
    Map<String, Object> matchmakingFilters
) {
}
