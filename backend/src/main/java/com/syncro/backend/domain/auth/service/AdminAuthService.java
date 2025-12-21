package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.config.AdminBootstrapProperties;
import com.syncro.backend.domain.auth.dto.AdminAuthResponse;
import com.syncro.backend.domain.auth.dto.AdminLoginRequest;
import com.syncro.backend.domain.auth.dto.AdminRegisterRequest;
import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.AdminUser;
import com.syncro.backend.domain.auth.mapper.AdminAuthMapper;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.security.AdminPrincipal;
import com.syncro.backend.security.JwtService;
import com.syncro.backend.security.SubjectType;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AdminAuthMapper adminAuthMapper;
    private final AdminBootstrapProperties adminBootstrapProperties;

    public AdminAuthService(
        AdminUserRepository adminUserRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AdminAuthMapper adminAuthMapper,
        AdminBootstrapProperties adminBootstrapProperties
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminAuthMapper = adminAuthMapper;
        this.adminBootstrapProperties = adminBootstrapProperties;
    }

    @Transactional
    public AdminAuthResponse login(AdminLoginRequest request) {
        String email = normalizeEmail(request.email());
        AdminUser adminUser = adminUserRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("Credenziali non valide"));
        if (adminUser.getStatus() != AdminStatus.ACTIVE) {
            throw new UnauthorizedException("Account sospeso");
        }
        if (!passwordEncoder.matches(request.password(), adminUser.getPassword())) {
            throw new UnauthorizedException("Credenziali non valide");
        }
        adminUser.setLastLogin(Instant.now());
        AdminUser savedAdmin = adminUserRepository.save(adminUser);
        return buildAuthResponse(savedAdmin);
    }

    @Transactional
    public AdminAuthResponse register(
        AdminRegisterRequest request,
        AdminPrincipal principal,
        String bootstrapSecret
    ) {
        if (principal != null) {
            if (!"SUPER_ADMIN".equals(principal.role())) {
                throw new UnauthorizedException("Permesso negato");
            }
        } else {
            ensureBootstrapAllowed(bootstrapSecret);
        }

        String email = normalizeEmail(request.email());
        if (adminUserRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Email gia registrata");
        }

        AdminUser adminUser = new AdminUser();
        adminUser.setEmail(email);
        adminUser.setPassword(passwordEncoder.encode(request.password()));
        adminUser.setRole(resolveRole(request.role(), principal));
        adminUser.setStatus(AdminStatus.ACTIVE);

        AdminUser savedAdmin = adminUserRepository.save(adminUser);
        return buildAuthResponse(savedAdmin);
    }

    public TokenResponse refresh(RefreshTokenRequest request) {
        UUID adminId = jwtService.parseRefreshToken(request.refreshToken(), SubjectType.ADMIN);
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new UnauthorizedException("Token non valido"));
        if (adminUser.getStatus() != AdminStatus.ACTIVE) {
            throw new UnauthorizedException("Account sospeso");
        }
        return buildTokenResponse(adminUser);
    }

    public AdminUserResponse getMe(AdminPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID adminId = principal.adminId();
        AdminUser adminUser = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Admin non trovato"));
        return adminAuthMapper.toAdminResponse(adminUser);
    }

    private AdminAuthResponse buildAuthResponse(AdminUser adminUser) {
        return new AdminAuthResponse(adminAuthMapper.toAdminResponse(adminUser), buildTokenResponse(adminUser));
    }

    private TokenResponse buildTokenResponse(AdminUser adminUser) {
        return new TokenResponse(
            jwtService.generateAdminAccessToken(adminUser.getId(), adminUser.getRole().name()),
            jwtService.generateAdminRefreshToken(adminUser.getId()),
            "Bearer",
            jwtService.getAccessTtlSeconds(),
            jwtService.getRefreshTtlSeconds()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void ensureBootstrapAllowed(String bootstrapSecret) {
        String configuredSecret = adminBootstrapProperties.bootstrapSecret();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            throw new UnauthorizedException("Bootstrap non abilitato");
        }
        if (bootstrapSecret == null || !configuredSecret.equals(bootstrapSecret)) {
            throw new UnauthorizedException("Bootstrap token non valido");
        }
        if (adminUserRepository.count() > 0) {
            throw new UnauthorizedException("Bootstrap gia completato");
        }
    }

    private AdminRole resolveRole(String requestedRole, AdminPrincipal principal) {
        if (requestedRole == null || requestedRole.isBlank()) {
            return AdminRole.SUPER_ADMIN;
        }
        AdminRole role = AdminRole.valueOf(requestedRole);
        if (principal == null) {
            return role;
        }
        return role;
    }
}
