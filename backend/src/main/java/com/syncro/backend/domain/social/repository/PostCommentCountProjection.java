package com.syncro.backend.domain.social.repository;

import java.util.UUID;

public interface PostCommentCountProjection {
    UUID getPostId();
    long getCommentCount();
}
