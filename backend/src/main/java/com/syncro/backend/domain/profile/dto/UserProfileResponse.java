package com.syncro.backend.domain.profile.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    UUID userId,
    String fullName,
    LocalDate birthDate,
    Integer age,
    String city,
    String country,
    String jobTitle,
    String companyName,
    String bio,
    String traitsText,
    String lovesText,
    String dislikesText,
    String goalsText,
    String valuesText,
    String zyraRecap,
    String relationshipStatus,
    String orientation,
    String childrenStatus,
    String visibility,
    Instant createdAt,
    Instant updatedAt
) {
}
