package com.syncro.backend.domain.profile.mapper;

import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.UserProfile;
import java.util.UUID;
import java.time.LocalDate;
import java.time.Period;
import org.springframework.stereotype.Component;

@Component
public class UserProfileMapper {

    public UserProfileResponse toResponse(UserProfile profile) {
        Integer age = calculateAge(profile.getBirthDate());
        return new UserProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getFullName(),
            profile.getBirthDate(),
            age,
            profile.getCity(),
            profile.getCountry(),
            profile.getBio(),
            profile.getVisibility().name(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }

    public UserSummaryResponse toSummary(UUID userId, UserProfile profile) {
        if (profile == null) {
            return new UserSummaryResponse(userId, null, null, null, null, null);
        }
        return new UserSummaryResponse(
            userId,
            profile.getFullName(),
            profile.getCity(),
            profile.getCountry(),
            null,
            profile.getVisibility() != null ? profile.getVisibility().name() : null
        );
    }

    private Integer calculateAge(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
