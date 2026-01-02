package com.syncro.backend.domain.backoffice.service;

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
import com.syncro.backend.domain.backoffice.dto.AdminCreateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminCreateUserRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserRequest;
import com.syncro.backend.security.AdminPrincipal;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBackofficeService {

    private final UserRepository userRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;
    private final AdminAuthMapper adminAuthMapper;

    public AdminBackofficeService(
        UserRepository userRepository,
        UserAuthProviderRepository userAuthProviderRepository,
        AdminUserRepository adminUserRepository,
        PasswordEncoder passwordEncoder,
        AuthMapper authMapper,
        AdminAuthMapper adminAuthMapper
    ) {
        this.userRepository = userRepository;
        this.userAuthProviderRepository = userAuthProviderRepository;
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authMapper = authMapper;
        this.adminAuthMapper = adminAuthMapper;
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
            user.setOnboardingCompleted(request.onboardingCompleted());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        User saved = userRepository.save(user);
        return authMapper.toUserResponse(saved);
    }

    @Transactional
    public void deleteUser(AdminPrincipal principal, UUID userId) {
        ensureSuperAdmin(principal);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
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
        adminUser.setRole(AdminRole.ADMIN);
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
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Admin non trovato"));
        adminUserRepository.delete(adminUser);
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

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "it";
        }
        return language.trim();
    }
}
