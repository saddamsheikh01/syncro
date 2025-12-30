package com.syncro.backend.domain.tags.mapper;

import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.entity.Tag;
import org.springframework.stereotype.Component;

@Component
public class TagMapper {

    public TagResponse toResponse(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName());
    }
}
