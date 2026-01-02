package com.syncro.backend.domain.matchmaking.mapper;

import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.matchmaking.dto.RecommendationResponse;
import com.syncro.backend.domain.matchmaking.dto.RecommendationType;
import com.syncro.backend.domain.matchmaking.entity.PlaceRecommendationScore;
import org.springframework.stereotype.Component;

@Component
public class RecommendationMapper {

    public RecommendationResponse toResponse(
        PlaceRecommendationScore score,
        PlaceSummaryResponse place,
        ExperienceSummaryResponse experience
    ) {
        RecommendationType type = score.getPlaceId() != null ? RecommendationType.PLACE : RecommendationType.EXPERIENCE;
        return new RecommendationResponse(
            score.getId(),
            type,
            place,
            experience,
            score.getScore(),
            score.getBreakdown(),
            score.getCreatedAt()
        );
    }
}
