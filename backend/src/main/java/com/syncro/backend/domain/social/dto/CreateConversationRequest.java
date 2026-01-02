package com.syncro.backend.domain.social.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateConversationRequest(
    @NotNull UUID otherUserId
) {
}
