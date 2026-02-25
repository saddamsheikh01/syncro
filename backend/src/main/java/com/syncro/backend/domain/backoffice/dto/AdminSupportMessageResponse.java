package com.syncro.backend.domain.backoffice.dto;

import com.syncro.backend.domain.support.entity.SupportCategory;
import java.time.Instant;
import java.util.UUID;

public record AdminSupportMessageResponse(
    UUID id,
    UUID userId,
    String userEmail,
    String username,
    String fullName,
    String subject,
    String message,
    SupportCategory category,
    Instant createdAt
) {
}
