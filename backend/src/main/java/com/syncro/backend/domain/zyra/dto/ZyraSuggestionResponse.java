package com.syncro.backend.domain.zyra.dto;

import com.syncro.backend.domain.zyra.entity.ZyraSuggestionType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ZyraSuggestionResponse(
    UUID id,
    UUID userId,
    ZyraSuggestionType suggestionType,
    Map<String, Object> payload,
    Instant createdAt
) {
}
