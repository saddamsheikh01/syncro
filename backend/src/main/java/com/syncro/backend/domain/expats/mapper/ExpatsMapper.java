package com.syncro.backend.domain.expats.mapper;

import com.syncro.backend.domain.expats.dto.AnswerResponse;
import com.syncro.backend.domain.expats.dto.FunnelConfigResponse;
import com.syncro.backend.domain.expats.dto.SessionResponse;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.entity.ExpatsFunnelConfig;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExpatsMapper {

    public FunnelConfigResponse toFunnelConfigResponse(ExpatsFunnelConfig config) {
        return new FunnelConfigResponse(
                config.getId(),
                config.getConfigKey(),
                config.getLanguage(),
                config.getVersion(),
                config.getContent(),
                config.getFeatureFlags(),
                config.getUpdatedAt()
        );
    }

    public SessionResponse toSessionResponse(ExpatsAnonymousSession session, List<ExpatsAnonymousAnswer> answers) {
        return new SessionResponse(
                session.getId(),
                session.getSessionToken(),
                session.getStatus(),
                session.getCurrentStep(),
                session.getTotalSteps(),
                session.getUserType(),
                session.getExpiresAt(),
                session.getLastSeenAt(),
                answers.stream().map(this::toAnswerResponse).toList()
        );
    }

    public AnswerResponse toAnswerResponse(ExpatsAnonymousAnswer answer) {
        return AnswerResponse.of(
                answer.getId(),
                answer.getStepNumber(),
                answer.getQuestionGroup(),
                answer.getQuestionKey(),
                answer.getAnswerValue(),
                answer.getAnsweredAt(),
                answer.getVersion()
        );
    }
}
