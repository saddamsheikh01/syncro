package com.syncro.backend.domain.social.dto;

import com.syncro.backend.domain.social.entity.PostMood;
import com.syncro.backend.domain.social.entity.PostScope;
import com.syncro.backend.domain.social.entity.PostTimeframe;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreatePostRequest(
    @NotBlank String content,
    String language,
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0") Double latitude,
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0") Double longitude,
    PostScope scope,
    PostMood mood,
    PostTimeframe timeframe,
    @Size(max = 10) List<UUID> taggedUserIds
) {
}
