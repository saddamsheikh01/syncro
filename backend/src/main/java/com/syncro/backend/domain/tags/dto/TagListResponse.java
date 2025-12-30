package com.syncro.backend.domain.tags.dto;

import java.util.List;

public record TagListResponse(
    List<TagResponse> tags
) {
}
