package com.syncro.backend.domain.favorites.mapper;

import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.favorites.dto.FavoriteResponse;
import com.syncro.backend.domain.favorites.dto.FavoriteType;
import com.syncro.backend.domain.favorites.entity.UserFavorite;
import org.springframework.stereotype.Component;

@Component
public class FavoriteMapper {

    public FavoriteResponse toResponse(
        UserFavorite favorite,
        PlaceSummaryResponse place,
        ExperienceSummaryResponse experience
    ) {
        FavoriteType type = favorite.getPlaceId() != null ? FavoriteType.PLACE : FavoriteType.EXPERIENCE;
        return new FavoriteResponse(
            favorite.getId(),
            type,
            place,
            experience,
            favorite.getCreatedAt()
        );
    }
}
