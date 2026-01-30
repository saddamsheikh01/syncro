package com.syncro.backend.domain.profile.dto;

import java.util.UUID;

public record UserPublicProfileResponse(
    UUID userId,
    String username,
    String fullName,
    Integer age,
    String city,
    String country,
    String jobTitle,
    String companyName,
    String bio,
    String avatarUrl,
    String visibility
) {
}
