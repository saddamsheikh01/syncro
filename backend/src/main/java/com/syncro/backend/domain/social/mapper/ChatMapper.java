package com.syncro.backend.domain.social.mapper;

import com.syncro.backend.domain.social.dto.ChatConversationResponse;
import com.syncro.backend.domain.social.dto.ChatMessageResponse;
import com.syncro.backend.domain.social.entity.ChatConversation;
import com.syncro.backend.domain.social.entity.ChatMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ChatMapper {

    public ChatConversationResponse toConversationResponse(ChatConversation conversation, List<UUID> participantIds) {
        return new ChatConversationResponse(
            conversation.getId(),
            participantIds,
            conversation.getCreatedAt()
        );
    }

    public ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getConversationId(),
            message.getUserId(),
            message.getContent(),
            message.getCreatedAt()
        );
    }
}
