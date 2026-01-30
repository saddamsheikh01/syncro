package com.syncro.backend.domain.profile.mapper;

import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.dto.UserPublicProfileResponse;
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
            profile.getJobTitle(),
            profile.getCompanyName(),
            profile.getBio(),
            profile.getTraitsText(),
            profile.getLovesText(),
            profile.getDislikesText(),
            profile.getGoalsText(),
            profile.getValuesText(),
            profile.getRelationshipStatus() != null ? profile.getRelationshipStatus().name() : null,
            profile.getOrientation() != null ? profile.getOrientation().name() : null,
            profile.getChildrenStatus() != null ? profile.getChildrenStatus().name() : null,
            profile.getVisibility().name(),
            profile.getCreatedAt(),
            profile.getUpdatedAt()
        );
    }

    public UserSummaryResponse toSummary(UUID userId, String username, UserProfile profile) {
        return toSummary(userId, username, profile, null);
    }

    public UserSummaryResponse toSummary(
        UUID userId,
        String username,
        UserProfile profile,
        String avatarUrl
    ) {
        if (profile == null) {
            return new UserSummaryResponse(userId, username, null, null, null, avatarUrl, null);
        }
        return new UserSummaryResponse(
            userId,
            username,
            profile.getFullName(),
            profile.getCity(),
            profile.getCountry(),
            avatarUrl,
            profile.getVisibility() != null ? profile.getVisibility().name() : null
        );
    }

    public UserPublicProfileResponse toPublicProfile(
        UUID userId,
        String username,
        UserProfile profile,
        String avatarUrl
    ) {
        if (profile == null) {
            return new UserPublicProfileResponse(
                userId,
                username,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                avatarUrl,
                null
            );
        }
        Integer age = calculateAge(profile.getBirthDate());
        return new UserPublicProfileResponse(
            userId,
            username,
            profile.getFullName(),
            age,
            profile.getCity(),
            profile.getCountry(),
            profile.getJobTitle(),
            profile.getCompanyName(),
            profile.getBio(),
            profile.getTraitsText(),
            profile.getLovesText(),
            profile.getDislikesText(),
            profile.getGoalsText(),
            profile.getValuesText(),
            profile.getRelationshipStatus() != null ? profile.getRelationshipStatus().name() : null,
            profile.getOrientation() != null ? profile.getOrientation().name() : null,
            profile.getChildrenStatus() != null ? profile.getChildrenStatus().name() : null,
            avatarUrl,
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
