package com.syncro.backend.domain.social.mapper;

import com.syncro.backend.domain.social.dto.PostResponse;
import com.syncro.backend.domain.social.dto.TaggedUserResponse;
import com.syncro.backend.domain.social.entity.Post;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    public PostResponse toResponse(
        Post post,
        long likeCount,
        long commentCount,
        boolean likedByMe,
        Map<String, Long> reactions,
        String myReaction,
        boolean favoritedByMe,
        Integer matchScore,
        List<TaggedUserResponse> taggedUsers
    ) {
        return new PostResponse(
            post.getId(),
            post.getUserId(),
            post.getContent(),
            post.getLanguage(),
            post.getLatitude(),
            post.getLongitude(),
            post.getScope() != null ? post.getScope().name() : null,
            post.getMood() != null ? post.getMood().name() : null,
            post.getTimeframe() != null ? post.getTimeframe().name() : null,
            likeCount,
            commentCount,
            likedByMe,
            reactions,
            myReaction,
            favoritedByMe,
            matchScore,
            taggedUsers,
            post.getCreatedAt()
        );
    }
}
