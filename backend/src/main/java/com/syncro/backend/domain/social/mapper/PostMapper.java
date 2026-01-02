package com.syncro.backend.domain.social.mapper;

import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.entity.Post;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    public PostResponse toResponse(Post post, long likeCount, boolean likedByMe) {
        return new PostResponse(
            post.getId(),
            post.getUserId(),
            post.getContent(),
            post.getLanguage(),
            post.getLatitude(),
            post.getLongitude(),
            likeCount,
            likedByMe,
            post.getCreatedAt()
        );
    }
}
