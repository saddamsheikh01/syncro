package com.syncro.backend.domain.social.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ChatParticipantId implements Serializable {

    private UUID conversationId;
    private UUID userId;

    public ChatParticipantId() {
    }

    public ChatParticipantId(UUID conversationId, UUID userId) {
        this.conversationId = conversationId;
        this.userId = userId;
    }

    public UUID getConversationId() {
        return conversationId;
    }

    public void setConversationId(UUID conversationId) {
        this.conversationId = conversationId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ChatParticipantId that = (ChatParticipantId) o;
        return Objects.equals(conversationId, that.conversationId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(conversationId, userId);
    }
}
