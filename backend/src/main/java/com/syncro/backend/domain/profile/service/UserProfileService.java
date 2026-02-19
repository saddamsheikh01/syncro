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
import com.syncro.backend.domain.profile.entity.ChildrenStatus;
import com.syncro.backend.domain.profile.entity.Gender;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.RelationshipStatus;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.profile.repository.UserProfileSearchSpec;
import com.syncro.backend.domain.profile.entity.Orientation;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import com.syncro.backend.domain.zyra.service.ZyraService;
import com.syncro.backend.security.UserPrincipal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserProfileMapper profileMapper;
    private final MediaObjectRepository mediaObjectRepository;
    private final OnboardingService onboardingService;
    private final ZyraService zyraService;

    public UserProfileService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        UserProfileMapper profileMapper,
        MediaObjectRepository mediaObjectRepository,
        OnboardingService onboardingService,
        ZyraService zyraService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.mediaObjectRepository = mediaObjectRepository;
        this.onboardingService = onboardingService;
        this.zyraService = zyraService;
    }

    @Transactional
    public UserProfileResponse getProfile(UserPrincipal principal) {
        User user = getUser(principal);
        UserProfile profile = profileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserProfile created = new UserProfile();
                created.setUser(user);
                return profileRepository.save(created);
            });
        String avatarUrl = resolveAvatarUrl(user.getId());
        return profileMapper.toResponse(profile, avatarUrl);
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
        if (request.jobTitle() != null) {
            profile.setJobTitle(normalizeOptionalText(request.jobTitle()));
        }
        if (request.companyName() != null) {
            profile.setCompanyName(normalizeOptionalText(request.companyName()));
        }
        if (request.bio() != null) {
            profile.setBio(normalizeText(request.bio()));
        }
        if (request.traitsText() != null) {
            profile.setTraitsText(normalizeOptionalText(request.traitsText()));
        }
        if (request.lovesText() != null) {
            profile.setLovesText(normalizeOptionalText(request.lovesText()));
        }
        if (request.dislikesText() != null) {
            profile.setDislikesText(normalizeOptionalText(request.dislikesText()));
        }
        if (request.goalsText() != null) {
            profile.setGoalsText(normalizeOptionalText(request.goalsText()));
        }
        if (request.valuesText() != null) {
            profile.setValuesText(normalizeOptionalText(request.valuesText()));
        }
        if (request.zyraRecap() != null) {
            profile.setZyraRecap(normalizeOptionalText(request.zyraRecap()));
        }
        if (request.gender() != null) {
            profile.setGender(parseGender(request.gender()));
        }
        if (request.relationshipStatus() != null) {
            profile.setRelationshipStatus(parseRelationshipStatus(request.relationshipStatus()));
        }
        if (request.orientation() != null) {
            profile.setOrientation(parseOrientation(request.orientation()));
        }
        if (request.childrenStatus() != null) {
            profile.setChildrenStatus(parseChildrenStatus(request.childrenStatus()));
        }
        if (request.visibility() != null) {
            profile.setVisibility(parseVisibility(request.visibility()));
        }

        UserProfile saved = profileRepository.save(profile);
        onboardingService.refreshOnboardingStatus(user);
        zyraService.refreshProfileRecap(user);
        String avatarUrl = resolveAvatarUrl(user.getId());
        return profileMapper.toResponse(saved, avatarUrl);
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
        return profileMapper.toSummary(targetUser.getId(), targetUser.getUsername(), profile, avatarUrl);
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
        return profileMapper.toPublicProfile(
            targetUser.getId(),
            targetUser.getUsername(),
            profile,
            avatarUrl
        );
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> searchUsers(String q, Pageable pageable) {
        String normalized = q == null ? "" : q.trim();

        if (normalized.isEmpty()) {
            return profileRepository
                .findByVisibilityOrderByFullNameAsc(ProfileVisibility.PUBLIC, pageable)
                .map(profile -> {
                    UUID userId = profile.getUser().getId();
                    String avatarUrl = resolveAvatarUrl(userId);
                    return profileMapper.toSummary(userId, profile.getUser().getUsername(), profile, avatarUrl);
                });
        }

        if (normalized.length() < 2) {
            return Page.empty(pageable);
        }
        return profileRepository.searchByNameOrCity(normalized, ProfileVisibility.PUBLIC, pageable)
            .map(profile -> {
                UUID userId = profile.getUser().getId();
                String avatarUrl = resolveAvatarUrl(userId);
                return profileMapper.toSummary(userId, profile.getUser().getUsername(), profile, avatarUrl);
            });
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> searchUsersWithFilters(
        String q,
        String city,
        String country,
        Integer ageMin,
        Integer ageMax,
        Gender gender,
        Orientation orientation,
        ZodiacSign zodiacSign,
        List<UUID> interestTagIds,
        String valuesText,
        Pageable pageable
    ) {
        String normalizedQ = (q != null && q.trim().length() >= 2) ? q.trim() : null;
        Specification<UserProfile> spec = UserProfileSearchSpec.withFilters(
            ProfileVisibility.PUBLIC,
            normalizedQ,
            trimToNull(city),
            trimToNull(country),
            ageMin,
            ageMax,
            gender,
            orientation,
            zodiacSign,
            interestTagIds != null && !interestTagIds.isEmpty() ? interestTagIds : null,
            trimToNull(valuesText)
        );
        return profileRepository.findAll(spec, pageable)
            .map(profile -> {
                UUID userId = profile.getUser().getId();
                String avatarUrl = resolveAvatarUrl(userId);
                return profileMapper.toSummary(userId, profile.getUser().getUsername(), profile, avatarUrl);
            });
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
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

    private RelationshipStatus parseRelationshipStatus(String status) {
        String normalized = normalizeOptionalText(status);
        if (normalized == null) {
            return null;
        }
        return RelationshipStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
    }

    private Gender parseGender(String gender) {
        String normalized = normalizeOptionalText(gender);
        if (normalized == null) {
            return null;
        }
        return Gender.valueOf(normalized.toUpperCase(Locale.ROOT));
    }

    private Orientation parseOrientation(String orientation) {
        String normalized = normalizeOptionalText(orientation);
        if (normalized == null) {
            return null;
        }
        return Orientation.valueOf(normalized.toUpperCase(Locale.ROOT));
    }

    private ChildrenStatus parseChildrenStatus(String status) {
        String normalized = normalizeOptionalText(status);
        if (normalized == null) {
            return null;
        }
        return ChildrenStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
    }

    private String normalizeText(String value) {
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
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
