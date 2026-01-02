package com.syncro.backend.domain.catalog.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class PlaceTagId implements Serializable {

    private UUID placeId;
    private UUID tagId;

    public PlaceTagId() {
    }

    public PlaceTagId(UUID placeId, UUID tagId) {
        this.placeId = placeId;
        this.tagId = tagId;
    }

    public UUID getPlaceId() {
        return placeId;
    }

    public void setPlaceId(UUID placeId) {
        this.placeId = placeId;
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
        PlaceTagId that = (PlaceTagId) o;
        return Objects.equals(placeId, that.placeId) && Objects.equals(tagId, that.tagId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(placeId, tagId);
    }
}
