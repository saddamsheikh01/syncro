package com.syncro.backend.domain.favorites.mapper;

import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.favorites.dto.FavoriteResponse;
import com.syncro.backend.domain.favorites.dto.FavoriteType;
import com.syncro.backend.domain.favorites.entity.UserFavorite;
import com.syncro.backend.domain.social.dto.PostSummaryResponse;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public FavoriteResponse toResponse(
        UserFavorite favorite,
        PlaceSummaryResponse place,
        ExperienceSummaryResponse experience,
        PostSummaryResponse post
    ) {
        FavoriteType type = favorite.getPlaceId() != null
            ? FavoriteType.PLACE
            : favorite.getExperienceId() != null
                ? FavoriteType.EXPERIENCE
                : FavoriteType.POST;
        return new FavoriteResponse(
            favorite.getId(),
            type,
            place,
            experience,
            post,
            favorite.getCreatedAt()
        );
    }
}
