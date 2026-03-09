package com.syncro.backend.domain.profile.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    UUID userId,
    String fullName,
    String avatarUrl,
    LocalDate birthDate,
    Integer age,
    String city,
    String country,
    String birthPlace,
    String jobTitle,
    String companyName,
    String bio,
    String traitsText,
    String lovesText,
    String dislikesText,
    String goalsText,
    String valuesText,
    String zyraRecap,
    String zyraBirthChartInterpretation,
    boolean hasBirthChart,
    String gender,
    String relationshipStatus,
    String orientation,
    String childrenStatus,
    String visibility,
    Instant createdAt,
    Instant updatedAt
) {
}
