package com.syncro.backend.domain.profile.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.profile.dto.UserPublicProfileResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserProfileMapper profileMapper;
    private final MediaObjectRepository mediaObjectRepository;
    private final OnboardingService onboardingService;

    public UserProfileService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        UserProfileMapper profileMapper,
        MediaObjectRepository mediaObjectRepository,
        OnboardingService onboardingService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.mediaObjectRepository = mediaObjectRepository;
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
        if (request.bio() != null) {
            profile.setBio(normalizeText(request.bio()));
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
        String avatarUrl = resolveAvatarUrl(targetUser.getId());
        return profileMapper.toSummary(targetUser.getId(), profile, avatarUrl);
    }

    @Transactional(readOnly = true)
    public UserPublicProfileResponse getPublicProfile(UserPrincipal principal, UUID userId) {
        getUser(principal);
        if (userId == null) {
            throw new NotFoundException("Utente non valido");
        }
        User targetUser = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        UserProfile profile = profileRepository.findByUserId(targetUser.getId()).orElse(null);
        if (profile == null) {
            throw new NotFoundException("Profilo non disponibile");
        }
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw new NotFoundException("Profilo privato. L'utente non rende visibili i dettagli.");
        }
        String avatarUrl = resolveAvatarUrl(targetUser.getId());
        return profileMapper.toPublicProfile(targetUser.getId(), profile, avatarUrl);
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> searchUsers(String q, Pageable pageable) {
        if (q == null || q.trim().length() < 2) {
            return Page.empty(pageable);
        }
        return profileRepository.searchByNameOrCity(q.trim(), ProfileVisibility.PUBLIC, pageable)
            .map(profile -> {
                UUID userId = profile.getUser().getId();
                String avatarUrl = resolveAvatarUrl(userId);
                return profileMapper.toSummary(userId, profile, avatarUrl);
            });
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

    private String resolveAvatarUrl(UUID userId) {
        if (userId == null) {
            return null;
        }
        return mediaObjectRepository
            .findFirstByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(MediaOwnerType.USER_PROFILE, userId)
            .map(media -> media.getUrl())
            .orElse(null);
    }
}
