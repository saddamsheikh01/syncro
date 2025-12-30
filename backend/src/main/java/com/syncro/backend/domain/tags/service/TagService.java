package com.syncro.backend.domain.tags.service;

import com.syncro.backend.domain.tags.dto.TagListResponse;
import com.syncro.backend.domain.tags.dto.TagResponse;
import com.syncro.backend.domain.tags.mapper.TagMapper;
import com.syncro.backend.domain.tags.repository.TagRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    public TagService(TagRepository tagRepository, TagMapper tagMapper) {
        this.tagRepository = tagRepository;
        this.tagMapper = tagMapper;
    }

    @Transactional(readOnly = true)
    public TagListResponse getTags() {
        List<TagResponse> tags = tagRepository.findAllByOrderByNameAsc().stream()
            .map(tagMapper::toResponse)
            .toList();
        return new TagListResponse(tags);
    }
}
