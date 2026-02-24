package com.syncro.backend.domain.notifications.dto;

import java.util.UUID;

public record AdminNotificationCampaignStatsResponse(
    UUID campaignId,
    long sentCount,
    long readCount,
    long unreadCount,
    double readRate
) {
}
