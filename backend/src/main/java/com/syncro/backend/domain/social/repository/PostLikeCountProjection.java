package com.syncro.backend.domain.social.repository;

import java.util.UUID;

public interface PostLikeCountProjection {

    UUID getPostId();

    long getLikeCount();
}
