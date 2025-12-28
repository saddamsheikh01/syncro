package com.syncro.backend.domain.profile.service;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.repository.UserPositionRepository;
import com.syncro.backend.domain.profile.repository.UserPreferenceRepository;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OnboardingService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final UserPositionRepository positionRepository;

    public OnboardingService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        UserPreferenceRepository preferenceRepository,
        UserPositionRepository positionRepository
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.preferenceRepository = preferenceRepository;
        this.positionRepository = positionRepository;
    }

    @Transactional
    public void refreshOnboardingStatus(User user) {
        boolean completed = profileRepository.existsByUserId(user.getId())
            && preferenceRepository.existsByUserId(user.getId())
            && positionRepository.existsByUserId(user.getId());
        if (user.isOnboardingCompleted() != completed) {
            user.setOnboardingCompleted(completed);
            userRepository.save(user);
        }
    }
}
