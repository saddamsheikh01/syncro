package com.syncro.backend.domain.profile.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.dto.UserPreferencesRequest;
import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.entity.UserPreference;
import com.syncro.backend.domain.profile.mapper.UserPreferenceMapper;
import com.syncro.backend.domain.profile.repository.UserPreferenceRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPreferenceService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final UserPreferenceMapper preferenceMapper;
    private final OnboardingService onboardingService;

    public UserPreferenceService(
        UserRepository userRepository,
        UserPreferenceRepository preferenceRepository,
        UserPreferenceMapper preferenceMapper,
        OnboardingService onboardingService
    ) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.preferenceMapper = preferenceMapper;
        this.onboardingService = onboardingService;
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(UserPrincipal principal) {
        User user = getUser(principal);
        UserPreference preferences = preferenceRepository.findByUserId(user.getId())
            .orElseThrow(() -> new NotFoundException("Preferenze non trovate"));
        return preferenceMapper.toResponse(preferences);
    }

    @Transactional
    public UserPreferencesResponse upsertPreferences(UserPrincipal principal, UserPreferencesRequest request) {
        User user = getUser(principal);
        UserPreference preferences = preferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPreference created = new UserPreference();
                created.setUser(user);
                return created;
            });

        if (request.matchmakingFilters() != null) {
            preferences.setMatchmakingFilters(request.matchmakingFilters());
        }
        if (request.feedPreferences() != null) {
            preferences.setFeedPreferences(request.feedPreferences());
        }

        UserPreference saved = preferenceRepository.save(preferences);
        onboardingService.refreshOnboardingStatus(user);
        return preferenceMapper.toResponse(saved);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
