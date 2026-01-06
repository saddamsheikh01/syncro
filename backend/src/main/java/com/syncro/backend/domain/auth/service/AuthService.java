package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.AuthResponse;
import com.syncro.backend.domain.auth.dto.LoginRequest;
import com.syncro.backend.domain.auth.dto.RefreshTokenRequest;
import com.syncro.backend.domain.auth.dto.RegisterRequest;
import com.syncro.backend.domain.auth.dto.TokenResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.AuthProvider;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserAuthProvider;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.UserAuthProviderRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.security.JwtService;
import com.syncro.backend.security.SubjectType;
import com.syncro.backend.security.UserPrincipal;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthMapper authMapper;

    public AuthService(
        UserRepository userRepository,
        UserAuthProviderRepository providerRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        AuthMapper authMapper
    ) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authMapper = authMapper;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email gia registrata");
        }

        User user = new User();
        user.setEmail(email);
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

        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("Credenziali non valide"));
        ensureUserActive(user);

        UserAuthProvider provider = providerRepository.findByUserIdAndProvider(
                user.getId(),
                AuthProvider.EMAIL
            )
            .orElseThrow(() -> new UnauthorizedException("Credenziali non valide"));

        if (!passwordEncoder.matches(request.password(), provider.getProviderUserId())) {
            throw new UnauthorizedException("Credenziali non valide");
        }

        return buildAuthResponse(user);
    }

    public TokenResponse refresh(RefreshTokenRequest request) {
        UUID userId = jwtService.parseRefreshToken(request.refreshToken(), SubjectType.USER);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UnauthorizedException("Token non valido"));
        ensureUserActive(user);
        return buildTokenResponse(user);
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

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
