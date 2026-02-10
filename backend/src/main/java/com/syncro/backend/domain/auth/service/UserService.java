package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.ChangePasswordRequest;
import com.syncro.backend.domain.auth.dto.DeleteUserRequest;
import com.syncro.backend.domain.auth.dto.UpdateUserRequest;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.dto.UsernameAvailabilityResponse;
import com.syncro.backend.domain.auth.entity.AuthProvider;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserAuthProvider;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.UserAuthProviderRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.security.UserPrincipal;
import java.util.Map;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9]{3,30}$");
    private static final String ACCOUNT_DELETION_CONFIRMATION_PHRASE = "DELETE MY PROFILE";
    private static final Pattern USERNAME_RESERVED_PATTERN =
        Pattern.compile("(riccardociviero|michelasardo|admin|support|syncro)");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{7,14}$");

    private final UserRepository userRepository;
    private final UserAuthProviderRepository userAuthProviderRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthMapper authMapper;
    private final AnalyticsService analyticsService;

    public UserService(
        UserRepository userRepository,
        UserAuthProviderRepository userAuthProviderRepository,
        PasswordEncoder passwordEncoder,
        AuthMapper authMapper,
        AnalyticsService analyticsService
    ) {
        this.userRepository = userRepository;
        this.userAuthProviderRepository = userAuthProviderRepository;
        this.passwordEncoder = passwordEncoder;
        this.authMapper = authMapper;
        this.analyticsService = analyticsService;
    }

    public UserResponse getMe(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        return authMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UserPrincipal principal, UpdateUserRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        boolean onboardingWasCompleted = user.isOnboardingCompleted();

        if (request.language() != null) {
            user.setLanguage(normalizeLanguage(request.language()));
        }
        if (request.onboardingCompleted() != null) {
            user.setOnboardingCompleted(request.onboardingCompleted());
        }
        if (request.username() != null) {
            String normalized = normalizeUsername(request.username());
            validateUsername(normalized);
            if (!isSameUsername(user, normalized)) {
                ensureUsernameAvailable(normalized, user.getId());
                user.setUsername(normalized);
            }
        }
        if (request.phone() != null) {
            String normalizedPhone = normalizePhone(request.phone());
            if (normalizedPhone == null) {
                user.setPhone(null);
            } else if (!normalizedPhone.equals(user.getPhone())) {
                ensurePhoneAvailable(normalizedPhone, user.getId());
                user.setPhone(normalizedPhone);
            }
        }

        User saved = userRepository.save(user);
        if (!onboardingWasCompleted && saved.isOnboardingCompleted()) {
            analyticsService.trackServerEventSafe(
                saved.getId(),
                "ONBOARDING_COMPLETED",
                Map.of("source", "PROFILE_UPDATE")
            );
        }
        return authMapper.toUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public UsernameAvailabilityResponse checkUsernameAvailability(
        UserPrincipal principal,
        String username
    ) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        String normalized = normalizeUsername(username);
        if (!isValidUsername(normalized)) {
            return new UsernameAvailabilityResponse(false);
        }
        if (isReservedUsername(normalized)) {
            return new UsernameAvailabilityResponse(false);
        }
        UUID userId = principal.userId();
        Optional<User> existing = userRepository.findByUsernameIgnoreCase(normalized);
        boolean available = existing.isEmpty() || existing.map(User::getId).get().equals(userId);
        return new UsernameAvailabilityResponse(available);
    }

    @Transactional
    public void deleteMe(UserPrincipal principal, DeleteUserRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        String confirmationPhrase = request.confirmationPhrase() == null
            ? ""
            : request.confirmationPhrase().trim();
        if (!ACCOUNT_DELETION_CONFIRMATION_PHRASE.equals(confirmationPhrase)) {
            throw new BadRequestException("Frase di conferma non valida");
        }

        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        userRepository.delete(user);
    }

    @Transactional
    public void changePassword(UserPrincipal principal, ChangePasswordRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }

        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        UserAuthProvider provider = userAuthProviderRepository.findByUserIdAndProvider(user.getId(), AuthProvider.EMAIL)
            .orElseThrow(() -> new BadRequestException("Operazione non disponibile per questo account"));
        String currentPasswordHash = provider.getProviderUserId();
        if (currentPasswordHash == null || currentPasswordHash.isBlank()) {
            throw new BadRequestException("Operazione non disponibile per questo account");
        }

        if (!passwordEncoder.matches(request.currentPassword(), currentPasswordHash)) {
            throw new BadRequestException("Password attuale non corretta");
        }
        if (passwordEncoder.matches(request.newPassword(), currentPasswordHash)) {
            throw new BadRequestException("La nuova password deve essere diversa da quella attuale");
        }

        provider.setProviderUserId(passwordEncoder.encode(request.newPassword()));
        userAuthProviderRepository.save(provider);
        analyticsService.trackServerEventSafe(
            user.getId(),
            "PASSWORD_CHANGED",
            Map.of("authProvider", AuthProvider.EMAIL.name())
        );
    }

    private String normalizeLanguage(String language) {
        return language.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            return null;
        }
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username non valido");
        }
        if (!isValidUsername(username)) {
            throw new BadRequestException("Username non valido");
        }
        if (isReservedUsername(username)) {
            throw new ConflictException("Username non disponibile");
        }
    }

    private void ensureUsernameAvailable(String username, UUID userId) {
        userRepository.findByUsernameIgnoreCase(username)
            .filter(existing -> !existing.getId().equals(userId))
            .ifPresent(existing -> {
                throw new ConflictException("Username gia in uso");
            });
    }

    private boolean isValidUsername(String username) {
        return username != null && USERNAME_PATTERN.matcher(username).matches();
    }

    private boolean isReservedUsername(String username) {
        return username != null && USERNAME_RESERVED_PATTERN.matcher(username).find();
    }

    private boolean isSameUsername(User user, String normalized) {
        if (normalized == null) {
            return user.getUsername() == null;
        }
        return normalized.equals(user.getUsername());
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

    private void ensurePhoneAvailable(String phone, UUID userId) {
        userRepository.findByPhone(phone)
            .filter(existing -> !existing.getId().equals(userId))
            .ifPresent(existing -> {
                throw new ConflictException("Telefono gia in uso");
            });
    }
}
