package com.syncro.backend.domain.notifications.dto;

import com.syncro.backend.domain.auth.entity.UserStatus;
import java.util.UUID;

public record AdminNotificationRecipientResponse(
    UUID id,
    String username,
    String fullName,
    UserStatus status
) {
}
