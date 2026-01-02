package com.syncro.backend.domain.media.mapper;

import com.syncro.backend.domain.media.dto.MediaResponse;
import com.syncro.backend.domain.media.entity.MediaObject;
import org.springframework.stereotype.Component;

@Component
public class MediaMapper {

    public MediaResponse toResponse(MediaObject media) {
        return new MediaResponse(
            media.getId(),
            media.getUrl(),
            media.getMediaType(),
            media.getOwnerType(),
            media.getOwnerId(),
            media.getCreatedAt()
        );
    }
}
