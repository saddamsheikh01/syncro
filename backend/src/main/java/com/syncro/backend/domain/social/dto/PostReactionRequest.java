package com.syncro.backend.domain.social.dto;

import com.syncro.backend.domain.social.entity.PostReactionType;
import jakarta.validation.constraints.NotNull;

public record PostReactionRequest(
    @NotNull PostReactionType reaction
) {
}
