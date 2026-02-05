package com.syncro.backend.domain.social.repository;

import java.util.UUID;

public interface PostReactionCountProjection {

    UUID getPostId();

    String getReaction();

    long getReactionCount();
}
