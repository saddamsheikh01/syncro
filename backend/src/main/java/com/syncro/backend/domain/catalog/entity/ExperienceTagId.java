package com.syncro.backend.domain.catalog.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class ExperienceTagId implements Serializable {

    private UUID experienceId;
    private UUID tagId;

    public ExperienceTagId() {
    }

    public ExperienceTagId(UUID experienceId, UUID tagId) {
        this.experienceId = experienceId;
        this.tagId = tagId;
    }

    public UUID getExperienceId() {
        return experienceId;
    }

    public void setExperienceId(UUID experienceId) {
        this.experienceId = experienceId;
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
        ExperienceTagId that = (ExperienceTagId) o;
        return Objects.equals(experienceId, that.experienceId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(experienceId, tagId);
    }
}
