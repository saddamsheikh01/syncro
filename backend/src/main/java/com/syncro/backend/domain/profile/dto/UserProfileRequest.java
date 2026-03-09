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
    @Size(max = 200) String birthPlace,
    @Size(max = 120) String jobTitle,
    @Size(max = 160) String companyName,
    @Size(max = 500) String bio,
    @Size(max = 500) String traitsText,
    @Size(max = 500) String lovesText,
    @Size(max = 500) String dislikesText,
    @Size(max = 500) String goalsText,
    @Size(max = 500) String valuesText,
    @Size(max = 5000) String zyraRecap,
    @Pattern(
        regexp = "^(MALE|FEMALE|NON_BINARY|OTHER|PREFER_NOT_TO_SAY)?$",
        message = "Genere non valido"
    )
    String gender,
    @Pattern(
        regexp = "^(SINGLE|IN_RELATIONSHIP|MARRIED|SEPARATED|COMPLICATED|OTHER)?$",
        message = "Stato relazionale non valido"
    )
    String relationshipStatus,
    @Pattern(
        regexp = "^(HETERO|GAY|BI|ASEXUAL|OTHER)?$",
        message = "Orientamento non valido"
    )
    String orientation,
    @Pattern(
        regexp = "^(NO_CHILDREN|HAS_CHILDREN|WANTS_CHILDREN|DOES_NOT_WANT|UNDECIDED)?$",
        message = "Stato figli non valido"
    )
    String childrenStatus,
    @Pattern(regexp = "PUBLIC|PARTIAL|PRIVATE") String visibility
) {
}
