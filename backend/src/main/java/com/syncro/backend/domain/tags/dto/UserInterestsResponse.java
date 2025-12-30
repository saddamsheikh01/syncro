package com.syncro.backend.domain.tags.dto;

import java.util.List;
import java.util.UUID;

public record UserInterestsResponse(
    UUID userId,
    List<TagResponse> tags
) {
}
