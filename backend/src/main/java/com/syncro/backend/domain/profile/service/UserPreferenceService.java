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
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
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
        preferences.setMatchmakingFilters(enforceAlwaysOnFlags(preferences.getMatchmakingFilters()));
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
            preferences.setMatchmakingFilters(enforceAlwaysOnFlags(request.matchmakingFilters()));
        }
        if (request.feedPreferences() != null) {
            preferences.setFeedPreferences(request.feedPreferences());
        }

        // Gestione privacy policy consent con timestamp
        if (request.privacyPolicyAccepted() != null) {
            Boolean currentValue = preferences.getPrivacyPolicyAccepted();
            if (!request.privacyPolicyAccepted().equals(currentValue)) {
                preferences.setPrivacyPolicyAccepted(request.privacyPolicyAccepted());
                if (Boolean.TRUE.equals(request.privacyPolicyAccepted())) {
                    preferences.setPrivacyPolicyAcceptedAt(Instant.now());
                }
            }
        }

        // Gestione newsletter consent con timestamp
        if (request.newsletterConsent() != null) {
            Boolean currentValue = preferences.getNewsletterConsent();
            if (!request.newsletterConsent().equals(currentValue)) {
                preferences.setNewsletterConsent(request.newsletterConsent());
                preferences.setNewsletterConsentAt(Instant.now());
            }
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

    private Map<String, Object> enforceAlwaysOnFlags(Map<String, Object> filters) {
        Map<String, Object> normalized = filters == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(filters);
        normalized.put("openToNewConnections", true);
        normalized.put("sharedInterests", true);
        return normalized;
    }
}
