package com.syncro.backend.domain.zyra.dto;

import com.syncro.backend.domain.zyra.entity.ZyraSuggestionType;
import jakarta.validation.constraints.NotNull;

public record ZyraSuggestionRequest(
    @NotNull ZyraSuggestionType suggestionType,
    String context
) {
}
