package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.DeleteUserRequest;
import com.syncro.backend.domain.auth.dto.SendEmailChangeOtpRequest;
import com.syncro.backend.domain.auth.dto.VerifyEmailChangeOtpRequest;
import com.syncro.backend.domain.auth.dto.UpdateUserRequest;
import com.syncro.backend.domain.auth.dto.UpdateUserResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.dto.UsernameAvailabilityResponse;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.security.UserPrincipal;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9]{3,30}$");
    private static final Set<String> SUPPORTED_LANGUAGES = Set.of("en", "it", "es", "fr", "sq", "pt");
    private static final String ACCOUNT_DELETION_CONFIRMATION_PHRASE = "DELETE MY PROFILE";
    private static final Pattern USERNAME_RESERVED_PATTERN =
        Pattern.compile("(riccardociviero|michelasardo|admin|support|syncro)");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{7,14}$");

    private final UserRepository userRepository;
    private final AuthMapper authMapper;
    private final EmailNotificationService emailNotificationService;
    private final EmailVerificationService emailVerificationService;

    public UserService(
        UserRepository userRepository,
        AuthMapper authMapper,
        EmailNotificationService emailNotificationService,
        EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.authMapper = authMapper;
        this.emailNotificationService = emailNotificationService;
        this.emailVerificationService = emailVerificationService;
    }

    public UserResponse getMe(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        return authMapper.toUserResponse(user);
    }

    public void recordDashboardVisit(UserPrincipal principal) {
        if (principal == null) return;
        recordActivity(principal.userId());
        try {
            emailNotificationService.sendWelcomeIfFirstVisit(principal.userId());
        } catch (Exception ignored) {
        }
    }

    @Transactional
    public void sendEmailChangeOtp(UserPrincipal principal, SendEmailChangeOtpRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
        }
        String normalizedEmail = normalizeEmail(request.newEmail());
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw new BadRequestException("Invalid email");
        }
        emailVerificationService.sendOtpForEmailChange(principal.userId(), normalizedEmail);
    }

    public UserResponse verifyEmailChangeOtp(UserPrincipal principal, VerifyEmailChangeOtpRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
        }
        emailVerificationService.verifyOtpForEmailChange(
            principal.userId(),
            request.newEmail(),
            request.otp()
        );
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        return authMapper.toUserResponse(user);
    }

    @Transactional
    public void recordActivity(UUID userId) {
        if (userId == null) return;
        userRepository.findById(userId).ifPresent(u -> {
            u.setLastActiveAt(Instant.now());
            userRepository.save(u);
        });
    }

    @Transactional
    public UpdateUserResponse updateMe(UserPrincipal principal, UpdateUserRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (request.language() != null) {
            user.setLanguage(normalizeLanguage(request.language()));
        }
        if (request.onboardingCompleted() != null) {
            throw new BadRequestException("onboardingCompleted is managed automatically");
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
        String newEmailAfterSave = null;
        boolean emailChangeRequiresVerification = false;
        if (request.email() != null && !request.email().isBlank()) {
            String normalizedEmail = normalizeEmail(request.email());
            String currentEmailNormalized = user.getEmail() != null ? normalizeEmail(user.getEmail()) : null;
            boolean emailActuallyChanged = currentEmailNormalized == null || !normalizedEmail.equals(currentEmailNormalized);
            if (emailActuallyChanged) {
                Optional<User> existingByEmail = userRepository.findByEmail(normalizedEmail);
                if (existingByEmail.isPresent()) {
                    throw new ConflictException("Email already in use");
                }
                newEmailAfterSave = normalizedEmail;
                emailChangeRequiresVerification = true;
            }
        }

        if (newEmailAfterSave != null && emailChangeRequiresVerification) {
            User saved = userRepository.save(user);
            try {
                emailVerificationService.sendOtpForEmailChange(user.getId(), newEmailAfterSave);
            } catch (Exception ex) {
                throw ex instanceof com.syncro.backend.common.exception.BadRequestException
                    || ex instanceof com.syncro.backend.common.exception.ConflictException
                    ? (RuntimeException) ex
                    : new com.syncro.backend.common.exception.BadRequestException("Unable to send verification code");
            }
            return UpdateUserResponse.verification(authMapper.toUserResponse(saved), newEmailAfterSave);
        }

        User saved = userRepository.save(user);
        return UpdateUserResponse.user(authMapper.toUserResponse(saved));
    }

    @Transactional(readOnly = true)
    public UsernameAvailabilityResponse checkUsernameAvailability(
        UserPrincipal principal,
        String username
    ) {
        if (principal == null) {
            throw new UnauthorizedException("Missing or invalid token");
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
            throw new UnauthorizedException("Missing or invalid token");
        }
        String confirmationPhrase = request.confirmationPhrase() == null
            ? ""
            : request.confirmationPhrase().trim();
        if (!ACCOUNT_DELETION_CONFIRMATION_PHRASE.equals(confirmationPhrase)) {
            throw new BadRequestException("Invalid confirmation phrase");
        }

        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        userRepository.delete(user);
    }

    private String normalizeLanguage(String language) {
        String normalized = language.trim().toLowerCase(Locale.ROOT);
        int separatorIndex = normalized.indexOf('-');
        if (separatorIndex > 0) {
            normalized = normalized.substring(0, separatorIndex);
        }
        if (!SUPPORTED_LANGUAGES.contains(normalized)) {
            throw new BadRequestException("Unsupported language");
        }
        return normalized;
    }

    private String normalizeUsername(String username) {
        if (username == null) {
            return null;
        }
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Invalid username");
        }
        if (!isValidUsername(username)) {
            throw new BadRequestException("Invalid username");
        }
        if (isReservedUsername(username)) {
            throw new ConflictException("Username is unavailable");
        }
    }

    private void ensureUsernameAvailable(String username, UUID userId) {
        userRepository.findByUsernameIgnoreCase(username)
            .filter(existing -> !existing.getId().equals(userId))
            .ifPresent(existing -> {
                throw new ConflictException("Username already in use");
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
            throw new BadRequestException("Invalid phone number");
        }
        return normalized;
    }

    private void ensurePhoneAvailable(String phone, UUID userId) {
        userRepository.findByPhone(phone)
            .filter(existing -> !existing.getId().equals(userId))
            .ifPresent(existing -> {
                throw new ConflictException("Phone number already in use");
            });
    }
}
