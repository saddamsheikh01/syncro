package com.syncro.backend.domain.social.mapper;

import com.syncro.backend.domain.social.dto.CommentResponse;
import com.syncro.backend.domain.social.entity.PostComment;
import org.springframework.stereotype.Component;

@Component
public class PostCommentMapper {

    public CommentResponse toResponse(PostComment comment, String username, String fullName, String avatarUrl) {
        return new CommentResponse(
            comment.getId(),
            comment.getPostId(),
            comment.getUserId(),
            username,
            fullName,
            avatarUrl,
            comment.getContent(),
            comment.getCreatedAt()
        );
    }
}
