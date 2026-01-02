package com.syncro.backend.domain.favorites.dto;

import java.util.UUID;

public record AddFavoriteRequest(
    UUID placeId,
    UUID experienceId
) {
}
