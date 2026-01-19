package com.syncro.backend.domain.profile.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.dto.UserProfileRequest;
import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.dto.UserSummaryResponse;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserProfileMapper profileMapper;
    private final OnboardingService onboardingService;

    public UserProfileService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        UserProfileMapper profileMapper,
        OnboardingService onboardingService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.onboardingService = onboardingService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UserPrincipal principal) {
        User user = getUser(principal);
        UserProfile profile = profileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new NotFoundException("Profilo non trovato"));
        return profileMapper.toResponse(profile);
    }

    @Transactional
    public UserProfileResponse upsertProfile(UserPrincipal principal, UserProfileRequest request) {
        User user = getUser(principal);
        UserProfile profile = profileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserProfile created = new UserProfile();
                created.setUser(user);
                return created;
            });

        if (request.fullName() != null) {
            profile.setFullName(normalizeText(request.fullName()));
        }
        if (request.birthDate() != null) {
            profile.setBirthDate(request.birthDate());
        }
        if (request.city() != null) {
            profile.setCity(normalizeText(request.city()));
        }
        if (request.country() != null) {
            profile.setCountry(normalizeText(request.country()));
        }
        if (request.visibility() != null) {
            profile.setVisibility(parseVisibility(request.visibility()));
        }

        UserProfile saved = profileRepository.save(profile);
        onboardingService.refreshOnboardingStatus(user);
        return profileMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getUserSummary(UserPrincipal principal, UUID userId) {
        getUser(principal); // solo per validare il token
        if (userId == null) {
            throw new NotFoundException("Utente non valido");
        }
        User targetUser = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        UserProfile profile = profileRepository.findByUserId(targetUser.getId()).orElse(null);
        return profileMapper.toSummary(targetUser.getId(), profile);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private ProfileVisibility parseVisibility(String visibility) {
        return ProfileVisibility.valueOf(visibility.trim().toUpperCase(Locale.ROOT));
    }

    private String normalizeText(String value) {
        return value.trim();
    }
}
