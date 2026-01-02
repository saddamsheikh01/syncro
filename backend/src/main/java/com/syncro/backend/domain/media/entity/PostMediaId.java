package com.syncro.backend.domain.media.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class PostMediaId implements Serializable {

    private UUID postId;
    private UUID mediaId;

    public PostMediaId() {
    }

    public PostMediaId(UUID postId, UUID mediaId) {
        this.postId = postId;
        this.mediaId = mediaId;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public UUID getMediaId() {
        return mediaId;
    }

    public void setMediaId(UUID mediaId) {
        this.mediaId = mediaId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        PostMediaId that = (PostMediaId) o;
        return Objects.equals(postId, that.postId) && Objects.equals(mediaId, that.mediaId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(postId, mediaId);
    }
}
