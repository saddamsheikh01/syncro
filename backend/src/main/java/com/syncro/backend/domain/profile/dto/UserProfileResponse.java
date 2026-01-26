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
    String visibility,
    Instant createdAt,
    Instant updatedAt
) {
}
