package com.syncro.backend.domain.tags.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserInterestId implements Serializable {

    private UUID userId;
    private UUID tagId;

    public UserInterestId() {
    }

    public UserInterestId(UUID userId, UUID tagId) {
        this.userId = userId;
        this.tagId = tagId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getTagId() {
        return tagId;
    }

    public void setTagId(UUID tagId) {
        this.tagId = tagId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserInterestId that = (UserInterestId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, tagId);
    }
}
