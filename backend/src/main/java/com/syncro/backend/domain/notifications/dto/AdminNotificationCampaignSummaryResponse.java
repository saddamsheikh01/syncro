package com.syncro.backend.domain.notifications.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminNotificationCampaignSummaryResponse(
    UUID campaignId,
    String title,
    Instant createdAt,
    long sentCount,
    long readCount,
    long unreadCount,
    double readRate
) {
}
