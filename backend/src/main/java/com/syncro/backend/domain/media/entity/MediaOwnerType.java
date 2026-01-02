package com.syncro.backend.domain.media.entity;

public enum MediaOwnerType {
    USER_PROFILE("user-profiles"),
    POST("posts"),
    PLACE("places"),
    EXPERIENCE("experiences");

    private final String folderName;

    MediaOwnerType(String folderName) {
        this.folderName = folderName;
    }

    public String getFolderName() {
        return folderName;
    }
}
