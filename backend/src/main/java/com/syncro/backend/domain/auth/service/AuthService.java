package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.AuthResponse;
import com.syncro.backend.domain.auth.dto.LoginRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetConfirmRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequest;
import com.syncro.backend.domain.auth.dto.PasswordResetRequestResponse;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.RegisterRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.dto.UserAdminAccessResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.AuthProvider;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserAuthProvider;
import com.syncro.backend.domain.auth.entity.UserPasswordResetToken;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.AdminUserRepository;
import com.syncro.backend.domain.auth.repository.UserAuthProviderRepository;
import com.syncro.backend.domain.auth.repository.UserPasswordResetTokenRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.domain.referrals.service.ReferralService;
import com.syncro.backend.security.JwtService;
import com.syncro.backend.security.SubjectType;
import com.syncro.backend.security.UserPrincipal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.security.SecureRandom;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{7,14}$");
    private static final Duration PASSWORD_RESET_TOKEN_TTL = Duration.ofMinutes(30);
    private static final int PASSWORD_RESET_TOKEN_BYTES = 32;
    private static final String PASSWORD_RESET_GENERIC_MESSAGE =
        "Se l'email e registrata, riceverai istruzioni per reimpostare la password";

    private final UserRepository userRepository;
    private final AdminUserRepository adminUserRepository;
    private final UserAuthProviderRepository providerRepository;
    private final UserPasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthMapper authMapper;
    private final ReferralService referralService;
    private final AnalyticsService analyticsService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
        UserRepository userRepository,
        AdminUserRepository adminUserRepository,
        UserAuthProviderRepository providerRepository,
        UserPasswordResetTokenRepository passwordResetTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuthMapper authMapper,
        ReferralService referralService,
        AnalyticsService analyticsService
    ) {
        this.userRepository = userRepository;
        this.adminUserRepository = adminUserRepository;
        this.providerRepository = providerRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authMapper = authMapper;
        this.referralService = referralService;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ip, String userAgent) {
        String email = normalizeEmail(request.email());
        String phone = normalizePhone(request.phone());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email gia registrata");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ConflictException("Telefono gia registrato");
        }

        User user = new User();
        user.setEmail(email);
        user.setPhone(phone);
        user.setLanguage("it");
        user.setOnboardingCompleted(false);
        user.setStatus(UserStatus.ACTIVE);
        User savedUser = userRepository.save(user);

        UserAuthProvider provider = new UserAuthProvider();
        provider.setUser(savedUser);
        provider.setProvider(AuthProvider.EMAIL);
        // Per email, usiamo provider_user_id come contenitore dell'hash finche lo schema non prevede un campo dedicato.
        provider.setProviderUserId(passwordEncoder.encode(request.password()));
        providerRepository.save(provider);

        referralService.registerReferralUsage(request.refCode(), savedUser.getId(), ip, userAgent);
        analyticsService.trackServerEventSafe(savedUser.getId(), "USER_REGISTERED", buildRegisterPayload(request));

        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            analyticsService.trackServerEventSafe(null, "LOGIN_FAILED", buildLoginFailurePayload("USER_NOT_FOUND"));
            throw new UnauthorizedException("Credenziali non valide");
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            analyticsService.trackServerEventSafe(user.getId(), "LOGIN_FAILED", buildLoginFailurePayload("USER_INACTIVE"));
            throw new UnauthorizedException("Account sospeso");
        }

        UserAuthProvider provider = providerRepository.findByUserIdAndProvider(user.getId(), AuthProvider.EMAIL).orElse(null);
        if (provider == null) {
            analyticsService.trackServerEventSafe(
                user.getId(),
                "LOGIN_FAILED",
                buildLoginFailurePayload("PROVIDER_NOT_FOUND")
            );
            throw new UnauthorizedException("Credenziali non valide");
        }

        if (!passwordEncoder.matches(request.password(), provider.getProviderUserId())) {
            analyticsService.trackServerEventSafe(
                user.getId(),
                "LOGIN_FAILED",
                buildLoginFailurePayload("INVALID_PASSWORD")
            );
            throw new UnauthorizedException("Credenziali non valide");
        }

        analyticsService.trackServerEventSafe(user.getId(), "LOGIN_SUCCESS", Map.of("authProvider", AuthProvider.EMAIL.name()));
        return buildAuthResponse(user);
    }

    public TokenResponse refresh(RefreshTokenRequest request) {
        UUID userId = jwtService.parseRefreshToken(request.refreshToken(), SubjectType.USER);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedException("Token non valido"));
        ensureUserActive(user);
        return buildTokenResponse(user);
    }

    @Transactional
    public PasswordResetRequestResponse requestPasswordReset(PasswordResetRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            analyticsService.trackServerEventSafe(
                user != null ? user.getId() : null,
                "PASSWORD_RESET_REQUESTED",
                Map.of("result", "USER_NOT_ELIGIBLE")
            );
            return new PasswordResetRequestResponse(PASSWORD_RESET_GENERIC_MESSAGE);
        }

        UserAuthProvider provider = providerRepository.findByUserIdAndProvider(user.getId(), AuthProvider.EMAIL).orElse(null);
        if (provider == null || provider.getProviderUserId() == null || provider.getProviderUserId().isBlank()) {
            analyticsService.trackServerEventSafe(
                user.getId(),
                "PASSWORD_RESET_REQUESTED",
                Map.of("result", "EMAIL_PROVIDER_NOT_ELIGIBLE")
            );
            return new PasswordResetRequestResponse(PASSWORD_RESET_GENERIC_MESSAGE);
        }

        Instant now = Instant.now();
        passwordResetTokenRepository.deleteByUserIdAndUsedAtIsNullAndExpiresAtAfter(user.getId(), now);

        String rawToken = generatePasswordResetToken();
        UserPasswordResetToken resetToken = new UserPasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(hashPasswordResetToken(rawToken));
        resetToken.setExpiresAt(now.plus(PASSWORD_RESET_TOKEN_TTL));
        passwordResetTokenRepository.save(resetToken);

        // Fallback temporaneo: token su log applicativo finché non viene integrato un provider email.
        logger.info("Password reset token generato per userId={}: {}", user.getId(), rawToken);
        analyticsService.trackServerEventSafe(
            user.getId(),
            "PASSWORD_RESET_REQUESTED",
            Map.of("result", "TOKEN_GENERATED")
        );

        return new PasswordResetRequestResponse(PASSWORD_RESET_GENERIC_MESSAGE);
    }

    @Transactional
    public void resetPassword(PasswordResetConfirmRequest request) {
        Instant now = Instant.now();
        String tokenHash = hashPasswordResetToken(request.token());

        UserPasswordResetToken resetToken = passwordResetTokenRepository
            .findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(tokenHash, now)
            .orElseThrow(() -> new BadRequestException("Token di reimpostazione non valido o scaduto"));

        User user = resetToken.getUser();
        ensureUserActive(user);

        UserAuthProvider provider = providerRepository.findByUserIdAndProvider(user.getId(), AuthProvider.EMAIL)
            .orElseThrow(() -> new BadRequestException("Token di reimpostazione non valido o scaduto"));
        String currentPasswordHash = provider.getProviderUserId();
        if (currentPasswordHash == null || currentPasswordHash.isBlank()) {
            throw new BadRequestException("Token di reimpostazione non valido o scaduto");
        }
        if (passwordEncoder.matches(request.newPassword(), currentPasswordHash)) {
            throw new BadRequestException("La nuova password deve essere diversa da quella attuale");
        }

        provider.setProviderUserId(passwordEncoder.encode(request.newPassword()));
        providerRepository.save(provider);

        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.deleteByUserIdAndUsedAtIsNullAndExpiresAtAfter(user.getId(), now);

        analyticsService.trackServerEventSafe(
            user.getId(),
            "PASSWORD_RESET_COMPLETED",
            Map.of("authProvider", AuthProvider.EMAIL.name())
        );
    }

    public UserResponse getMe(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        ensureUserActive(user);
        return authMapper.toUserResponse(user);
    }

    public UserAdminAccessResponse getAdminAccess(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        ensureUserActive(user);

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            return new UserAdminAccessResponse(false);
        }

        boolean isSuperAdmin = adminUserRepository.findByEmail(normalizeEmail(email))
            .map(admin -> admin.getRole() == AdminRole.SUPER_ADMIN && admin.getStatus() == AdminStatus.ACTIVE)
            .orElse(false);

        return new UserAdminAccessResponse(isSuperAdmin);
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(authMapper.toUserResponse(user), buildTokenResponse(user));
    }

    private TokenResponse buildTokenResponse(User user) {
        return new TokenResponse(
            jwtService.generateUserAccessToken(user.getId()),
            jwtService.generateUserRefreshToken(user.getId()),
            "Bearer",
            jwtService.getAccessTtlSeconds(),
            jwtService.getRefreshTtlSeconds()
        );
    }

    private void ensureUserActive(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account sospeso");
        }
    }

    private Map<String, Object> buildRegisterPayload(RegisterRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("authProvider", AuthProvider.EMAIL.name());
        payload.put("hasPhone", request.phone() != null && !request.phone().isBlank());
        payload.put("hasReferralCode", request.refCode() != null && !request.refCode().isBlank());
        return payload;
    }

    private Map<String, Object> buildLoginFailurePayload(String reason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("reason", reason);
        payload.put("authProvider", AuthProvider.EMAIL.name());
        return payload;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generatePasswordResetToken() {
        byte[] random = new byte[PASSWORD_RESET_TOKEN_BYTES];
        secureRandom.nextBytes(random);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    private String hashPasswordResetToken(String token) {
        String value = Objects.requireNonNull(token, "token");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Algoritmo di hash non disponibile", ex);
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String normalized = phone.trim().replaceAll("[\\s()\\-]", "");
        if (normalized.isBlank()) {
            return null;
        }
        if (!PHONE_PATTERN.matcher(normalized).matches()) {
            throw new BadRequestException("Telefono non valido");
        }
        return normalized;
    }
}
