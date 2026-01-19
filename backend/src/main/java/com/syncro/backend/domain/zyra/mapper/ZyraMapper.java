package com.syncro.backend.domain.zyra.mapper;

import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionResponse;
import com.syncro.backend.domain.zyra.entity.ZyraChatSession;
import com.syncro.backend.domain.zyra.entity.ZyraMessage;
import com.syncro.backend.domain.zyra.entity.ZyraSuggestion;
import org.springframework.stereotype.Component;

@Component
public class ZyraMapper {

    public ZyraSessionResponse toSessionResponse(ZyraChatSession session) {
        return new ZyraSessionResponse(
            session.getId(),
            session.getUserId(),
            session.getTitle(),
            session.getCreatedAt()
        );
    }

    public ZyraMessageResponse toMessageResponse(ZyraMessage message) {
        return new ZyraMessageResponse(
            message.getId(),
            message.getSessionId(),
            message.getRole(),
            message.getContent(),
            message.getCreatedAt()
        );
    }

    public ZyraSuggestionResponse toSuggestionResponse(ZyraSuggestion suggestion) {
        return new ZyraSuggestionResponse(
            suggestion.getId(),
            suggestion.getUserId(),
            suggestion.getSuggestionType(),
            suggestion.getPayload(),
            suggestion.getCreatedAt()
        );
    }
}
