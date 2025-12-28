package com.syncro.backend.domain.profile.dto;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UserProfileRequest(
    @Size(max = 200) String fullName,
    @Past LocalDate birthDate,
    @Size(max = 120) String city,
    @Size(max = 120) String country,
    @Pattern(regexp = "PUBLIC|PARTIAL|PRIVATE") String visibility
) {
}
