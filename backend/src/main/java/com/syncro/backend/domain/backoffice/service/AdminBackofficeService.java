package com.syncro.backend.domain.backoffice.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.auth.entity.AuthProvider;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserAuthProvider;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.mapper.AdminAuthMapper;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.domain.auth.repository.UserAuthProviderRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.auth.service.AuthService;
import com.syncro.backend.domain.backoffice.dto.AdminCreateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminCreateUserRequest;
import com.syncro.backend.domain.backoffice.dto.AdminOnboardingBackfillResponse;
import com.syncro.backend.domain.backoffice.dto.AdminSupportMessageResponse;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserMatchmakingRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserPasswordRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserRequest;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.profile.entity.UserPreference;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.mapper.UserProfileMapper;
import com.syncro.backend.domain.profile.mapper.UserPreferenceMapper;
import com.syncro.backend.domain.profile.repository.UserPreferenceRepository;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.support.entity.SupportCategory;
import com.syncro.backend.domain.support.entity.SupportMessage;
import com.syncro.backend.domain.support.repository.SupportMessageRepository;
import com.syncro.backend.domain.tests.dto.TestCountResponse;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBackofficeService {
    private static final List<String> MATCH_DOMAIN_KEYS = List.of(
        "love",
        "friendship",
        "work",
        "projects",
        "hobby",
        "growth"
    );

    private final UserRepository userRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserProfileRepository userProfileRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;
    private final AdminAuthMapper adminAuthMapper;
    private final UserPreferenceMapper userPreferenceMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final MediaObjectRepository mediaObjectRepository;
    private final SupportMessageRepository supportMessageRepository;
    private final AuthService authService;
    private final JdbcTemplate jdbcTemplate;

    public AdminBackofficeService(
        UserRepository userRepository,
        UserAuthProviderRepository userAuthProviderRepository,
        UserPreferenceRepository userPreferenceRepository,
        UserProfileRepository userProfileRepository,
        AdminUserRepository adminUserRepository,
        PasswordEncoder passwordEncoder,
        AuthMapper authMapper,
        AdminAuthMapper adminAuthMapper,
        UserPreferenceMapper userPreferenceMapper,
        UserProfileMapper userProfileMapper,
        UserTestSubmissionRepository userTestSubmissionRepository,
        MediaObjectRepository mediaObjectRepository,
        SupportMessageRepository supportMessageRepository,
        AuthService authService,
        JdbcTemplate jdbcTemplate
    ) {
        this.userRepository = userRepository;
        this.userAuthProviderRepository = userAuthProviderRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.userProfileRepository = userProfileRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authMapper = authMapper;
        this.adminAuthMapper = adminAuthMapper;
        this.userPreferenceMapper = userPreferenceMapper;
        this.userProfileMapper = userProfileMapper;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.mediaObjectRepository = mediaObjectRepository;
        this.supportMessageRepository = supportMessageRepository;
        this.authService = authService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(
        AdminPrincipal principal,
        String email,
        UserStatus status,
        Boolean onboardingCompleted,
        int page,
        int size
    ) {
        ensureSuperAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        String normalizedEmail = normalizeEmailFilter(email);
        if (normalizedEmail == null && status == null && onboardingCompleted == null) {
            return userRepository.findAll(pageable).map(authMapper::toUserResponse);
        }
        return userRepository.searchUsers(normalizedEmail, status, onboardingCompleted, pageable)
            .map(authMapper::toUserResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        return authMapper.toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new NotFoundException("Profilo non trovato"));
        String avatarUrl = resolveAvatarUrl(user.getId());
        return userProfileMapper.toResponse(profile, avatarUrl);
    }

    @Transactional(readOnly = true)
    public TestCountResponse getUserTestsCount(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        long count = userTestSubmissionRepository.countDistinctTestDefinitionIdByUserId(user.getId());
        return new TestCountResponse(count);
    }

    @Transactional(readOnly = true)
    public UserPreferencesResponse getUserPreferences(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        UserPreference preferences = userPreferenceRepository.findByUserId(user.getId()).orElse(null);
        if (preferences == null) {
            UserPreference created = new UserPreference();
            created.setUser(user);
            created.setMatchmakingFilters(normalizeMatchmakingFilters(null));
            created.setFeedPreferences(Map.of());
            preferences = userPreferenceRepository.save(created);
        }

        preferences.setMatchmakingFilters(normalizeMatchmakingFilters(preferences.getMatchmakingFilters()));
        if (preferences.getFeedPreferences() == null) {
            preferences.setFeedPreferences(Map.of());
        }

        return userPreferenceMapper.toResponse(preferences);
    }

    @Transactional
    public UserPreferencesResponse updateUserMatchmakingPreferences(
        AdminPrincipal principal,
        UUID userId,
        AdminUpdateUserMatchmakingRequest request
    ) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        UserPreference preferences = userPreferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPreference created = new UserPreference();
                created.setUser(user);
                created.setFeedPreferences(Map.of());
                return created;
            });

        preferences.setMatchmakingFilters(normalizeMatchmakingFilters(request.matchmakingFilters()));
        if (preferences.getFeedPreferences() == null) {
            preferences.setFeedPreferences(Map.of());
        }

        UserPreference saved = userPreferenceRepository.save(preferences);
        return userPreferenceMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse createUser(AdminPrincipal principal, AdminCreateUserRequest request) {
        ensureSuperAdmin(principal);
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email gia registrata");
        }

        User user = new User();
        user.setEmail(email);
        user.setLanguage(normalizeLanguage(request.language()));
        user.setOnboardingCompleted(false);
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        UserAuthProvider provider = new UserAuthProvider();
        provider.setUser(savedUser);
        provider.setProvider(AuthProvider.EMAIL);
        provider.setProviderUserId(passwordEncoder.encode(request.password()));
        userAuthProviderRepository.save(provider);

        return authMapper.toUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(
        AdminPrincipal principal,
        UUID userId,
        AdminUpdateUserRequest request
    ) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        if (request.language() != null) {
            user.setLanguage(request.language());
        }
        if (request.onboardingCompleted() != null) {
            throw new BadRequestException("onboardingCompleted e gestito automaticamente");
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        User saved = userRepository.save(user);
        return authMapper.toUserResponse(saved);
    }

    @Transactional
    public void updateUserPassword(
        AdminPrincipal principal,
        UUID userId,
        AdminUpdateUserPasswordRequest request
    ) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        UserAuthProvider provider = userAuthProviderRepository.findByUserIdAndProvider(user.getId(), AuthProvider.EMAIL)
            .orElseGet(() -> {
                UserAuthProvider newProvider = new UserAuthProvider();
                newProvider.setUser(user);
                newProvider.setProvider(AuthProvider.EMAIL);
                return newProvider;
            });

        String currentPasswordHash = provider.getProviderUserId();
        if (currentPasswordHash != null && !currentPasswordHash.isBlank()
            && passwordEncoder.matches(request.newPassword(), currentPasswordHash)) {
            throw new BadRequestException("La nuova password deve essere diversa da quella attuale");
        }

        provider.setProviderUserId(passwordEncoder.encode(request.newPassword()));
        userAuthProviderRepository.save(provider);
    }

    @Transactional
    public void sendUserPasswordResetLink(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        authService.requestPasswordResetByAdmin(userId);
    }

    @Transactional
    public void deleteUser(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
    }

    @Transactional
    public AdminOnboardingBackfillResponse backfillOnboardingStatus(AdminPrincipal principal) {
        ensureSuperAdmin(principal);

        long totalUsers = userRepository.count();
        long completedBefore = userRepository.countByOnboardingCompletedTrue();

        int updatedUsers = jdbcTemplate.update(
            """
                update users u
                set onboarding_completed = computed.completed
                from (
                    select
                        u2.id,
                        exists (
                            select 1
                            from user_profiles up
                            where up.user_id = u2.id
                              and nullif(trim(up.full_name), '') is not null
                              and nullif(trim(up.city), '') is not null
                              and nullif(trim(up.country), '') is not null
                        ) as completed
                    from users u2
                ) computed
                where u.id = computed.id
                  and u.onboarding_completed is distinct from computed.completed
                """
        );

        long completedAfter = userRepository.countByOnboardingCompletedTrue();
        return new AdminOnboardingBackfillResponse(
            totalUsers,
            completedBefore,
            completedAfter,
            updatedUsers
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAdminUsers(
        AdminPrincipal principal,
        String email,
        AdminStatus status,
        AdminRole role,
        int page,
        int size
    ) {
        ensureSuperAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        String normalizedEmail = normalizeEmailFilter(email);
        if (normalizedEmail == null && status == null && role == null) {
            return adminUserRepository.findAll(pageable).map(adminAuthMapper::toAdminResponse);
        }
        return adminUserRepository.searchAdmins(normalizedEmail, status, role, pageable)
            .map(adminAuthMapper::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getAdminUser(AdminPrincipal principal, UUID adminId) {
        ensureSuperAdmin(principal);
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Admin non trovato"));
        return adminAuthMapper.toAdminResponse(adminUser);
    }

    @Transactional
    public AdminUserResponse createAdmin(AdminPrincipal principal, AdminCreateAdminRequest request) {
        ensureSuperAdmin(principal);
        String email = normalizeEmail(request.email());
        if (adminUserRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Email gia registrata");
        }

        AdminUser adminUser = new AdminUser();
        adminUser.setEmail(email);
        adminUser.setPassword(passwordEncoder.encode(request.password()));
        adminUser.setRole(request.role() != null ? request.role() : AdminRole.ADMIN);
        adminUser.setStatus(AdminStatus.ACTIVE);

        AdminUser saved = adminUserRepository.save(adminUser);
        return adminAuthMapper.toAdminResponse(saved);
    }

    @Transactional
    public AdminUserResponse updateAdmin(
        AdminPrincipal principal,
        UUID adminId,
        AdminUpdateAdminRequest request
    ) {
        ensureSuperAdmin(principal);
        if (request.status() == AdminStatus.SUSPENDED && principal.adminId().equals(adminId)) {
            throw new ConflictException("Non puoi sospendere il tuo stesso account");
        }
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Admin non trovato"));
        if (request.status() != null) {
            adminUser.setStatus(request.status());
        }
        AdminUser saved = adminUserRepository.save(adminUser);
        return adminAuthMapper.toAdminResponse(saved);
    }

    @Transactional
    public void deleteAdmin(AdminPrincipal principal, UUID adminId) {
        ensureSuperAdmin(principal);
        if (principal.adminId().equals(adminId)) {
            throw new ConflictException("Non puoi eliminare il tuo stesso account");
        }
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Admin non trovato"));
        adminUserRepository.delete(adminUser);
    }

    @Transactional(readOnly = true)
    public Page<AdminSupportMessageResponse> getSupportMessages(
        AdminPrincipal principal,
        String q,
        SupportCategory category,
        int page,
        int size
    ) {
        ensureSuperAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        String normalizedQuery = normalizeSearchQuery(q);
        Page<SupportMessage> messages = supportMessageRepository.search(normalizedQuery, category, pageable);

        List<UUID> userIds = messages.getContent().stream()
            .map(SupportMessage::getUserId)
            .filter(id -> id != null)
            .distinct()
            .toList();

        Map<UUID, UserProfile> profilesByUserId = new HashMap<>();
        if (!userIds.isEmpty()) {
            userProfileRepository.findByUserIdIn(userIds)
                .forEach(profile -> {
                    if (profile.getUser() != null && profile.getUser().getId() != null) {
                        profilesByUserId.put(profile.getUser().getId(), profile);
                    }
                });
        }

        return messages.map(message -> {
            User user = message.getUser();
            UserProfile profile = profilesByUserId.get(message.getUserId());
            String fullName = profile != null ? profile.getFullName() : null;
            return new AdminSupportMessageResponse(
                message.getId(),
                message.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getUsername() : null,
                fullName,
                message.getSubject(),
                message.getMessage(),
                message.getCategory(),
                message.getCreatedAt()
            );
        });
    }

    private void ensureSuperAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        AdminRole role = AdminRole.valueOf(principal.role());
        if (role != AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmailFilter(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSearchQuery(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }
        return query.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "it";
        }
        return language.trim();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private Integer toInteger(Object value) {
        if (value instanceof Integer intValue) {
            return intValue;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String str && !str.isBlank()) {
            try {
                return Integer.parseInt(str.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, Object> normalizeMatchmakingFilters(Map<String, Object> rawFilters) {
        Map<String, Object> normalized = rawFilters == null
            ? new LinkedHashMap<>()
            : new LinkedHashMap<>(rawFilters);

        normalized.put("openToNewConnections", true);
        normalized.put("sharedInterests", true);

        Map<String, Object> activeDomains = new LinkedHashMap<>();
        for (String domainKey : MATCH_DOMAIN_KEYS) {
            activeDomains.put(domainKey, true);
        }
        normalized.put("activeDomains", activeDomains);

        Map<String, Object> configuredDomainWeights = toMap(normalized.get("domainWeights"));
        Map<String, Object> normalizedDomainWeights = new LinkedHashMap<>();
        boolean hasPositiveWeight = false;
        for (String domainKey : MATCH_DOMAIN_KEYS) {
            Integer configuredWeight = toInteger(configuredDomainWeights.get(domainKey));
            int weight = Math.max(0, configuredWeight != null ? configuredWeight : 1);
            if (weight > 0) {
                hasPositiveWeight = true;
            }
            normalizedDomainWeights.put(domainKey, weight);
        }
        if (!hasPositiveWeight) {
            for (String domainKey : MATCH_DOMAIN_KEYS) {
                normalizedDomainWeights.put(domainKey, 1);
            }
        }
        normalized.put("domainWeights", normalizedDomainWeights);

        return normalized;
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
