package com.syncro.backend.domain.social.repository;

import java.util.UUID;

public interface PostUserReactionProjection {

    UUID getPostId();

    String getReaction();
}
