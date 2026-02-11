package com.syncro.backend.domain.matchmaking.mapper;

import com.syncro.backend.domain.matchmaking.dto.UserMatchResponse;
import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class UserMatchMapper {

    public UserMatchResponse toResponse(
        UserMatchScore matchScore,
        UUID currentUserId,
        Integer scoreTotal,
        String explanation,
        UserSummaryResponse userSummary
    ) {
        UUID otherUserId = resolveOtherUserId(matchScore, currentUserId);
        return new UserMatchResponse(
            matchScore.getId(),
            otherUserId,
            userSummary,
            scoreTotal != null ? scoreTotal : matchScore.getScoreTotal(),
            matchScore.getBreakdown(),
            explanation,
            matchScore.getCreatedAt(),
            matchScore.getUpdatedAt()
        );
    }

    private UUID resolveOtherUserId(UserMatchScore matchScore, UUID currentUserId) {
        if (currentUserId == null) {
            return matchScore.getUserBId();
        }
        if (currentUserId.equals(matchScore.getUserAId())) {
            return matchScore.getUserBId();
        }
        return matchScore.getUserAId();
    }
}
