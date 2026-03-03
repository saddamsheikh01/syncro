package com.syncro.backend.domain.profile.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final AnalyticsService analyticsService;

    public OnboardingService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        AnalyticsService analyticsService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public void refreshOnboardingStatus(User user) {
        boolean wasCompleted = user.isOnboardingCompleted();
        boolean completed = profileRepository.findByUserId(user.getId())
            .map(this::hasRequiredOnboardingProfileData)
            .orElse(false);
        if (wasCompleted != completed) {
            user.setOnboardingCompleted(completed);
            userRepository.save(user);
            if (!wasCompleted && completed) {
                analyticsService.trackServerEventSafe(
                    user.getId(),
                    "ONBOARDING_COMPLETED",
                    Map.of("source", "ONBOARDING_SERVICE")
                );
            }
        }
    }

    private boolean hasRequiredOnboardingProfileData(UserProfile profile) {
        return hasText(profile.getFullName())
            && hasText(profile.getCity())
            && hasText(profile.getCountry());
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
