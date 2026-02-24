package com.syncro.backend.domain.notifications.dto;

import com.syncro.backend.domain.notifications.entity.NotificationType;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    UUID userId,
    NotificationType type,
    String title,
    String body,
    Map<String, Object> data,
    UUID conversationId,
    UUID messageId,
    UUID createdByAdminId,
    UUID campaignId,
    Instant createdAt,
    Instant readAt
) {
}
