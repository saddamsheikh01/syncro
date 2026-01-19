package com.syncro.backend.domain.social.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatConversationResponse(
    UUID id,
    List<UUID> participantIds,
    List<ChatParticipantInfo> participants,
    ChatMessageResponse lastMessage,
    Instant createdAt
) {
}
