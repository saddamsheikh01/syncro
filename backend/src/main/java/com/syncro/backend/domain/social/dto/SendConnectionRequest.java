package com.syncro.backend.domain.social.dto;

import com.syncro.backend.domain.social.entity.ConnectionContext;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendConnectionRequest(
    @NotNull UUID toUserId,
    @NotNull ConnectionContext context
) {
}
