package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.EmailVerificationOtp;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.EmailVerificationOtpRepository;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.external.brevo.BrevoConfig;
import com.syncro.backend.domain.external.brevo.BrevoMailClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 15;
    private static final int OTP_RESEND_COOLDOWN_MINUTES = 2;

    private final UserRepository userRepository;
    private final EmailVerificationOtpRepository otpRepository;
    private final BrevoConfig brevoConfig;
    private final BrevoMailClient brevoMailClient;
    private final EmailNotificationService emailNotificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
        UserRepository userRepository,
        EmailVerificationOtpRepository otpRepository,
        BrevoConfig brevoConfig,
        BrevoMailClient brevoMailClient,
        EmailNotificationService emailNotificationService
    ) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.brevoConfig = brevoConfig;
        this.brevoMailClient = brevoMailClient;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public void sendOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email already verified");
        }

        Optional<EmailVerificationOtp> existing = otpRepository.findFirstByUserIdAndTargetEmailHashIsNullOrderByCreatedAtDesc(user.getId());
        if (existing.isPresent()) {
            Instant cooldownUntil = existing.get().getCreatedAt().plusSeconds(OTP_RESEND_COOLDOWN_MINUTES * 60L);
            if (Instant.now().isBefore(cooldownUntil)) {
                throw new BadRequestException("Please wait before requesting a new code");
            }
        }

        otpRepository.deleteByUserId(user.getId());

        String otp = generateOtp();
        String otpHash = hashOtp(otp);
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60L);

        EmailVerificationOtp entity = new EmailVerificationOtp();
        entity.setUser(user);
        entity.setOtpHash(otpHash);
        entity.setExpiresAt(expiresAt);
        otpRepository.save(entity);

        sendOtpEmail(user, otp);
    }

    /**
     * Send OTP for email change. Does NOT update user email.
     * User email is updated only when verifyOtpForEmailChange succeeds (newEmail comes from frontend).
     */
    @Transactional
    public void sendOtpForEmailChange(UUID userId, String newEmail) {
        String normalizedNewEmail = normalizeEmail(newEmail);
        if (normalizedNewEmail.isBlank()) {
            throw new BadRequestException("Invalid email");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (userRepository.findByEmail(normalizedNewEmail).filter(u -> !u.getId().equals(userId)).isPresent()) {
            throw new BadRequestException("Email already in use");
        }
        String currentEmail = user.getEmail();
        if (normalizedNewEmail.equals(currentEmail != null ? normalizeEmail(currentEmail) : null)) {
            throw new BadRequestException("New email is same as current");
        }

        Optional<EmailVerificationOtp> existing = otpRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
        if (existing.isPresent()) {
            Instant cooldownUntil = existing.get().getCreatedAt().plusSeconds(OTP_RESEND_COOLDOWN_MINUTES * 60L);
            if (Instant.now().isBefore(cooldownUntil)) {
                throw new BadRequestException("Please wait before requesting a new code");
            }
        }

        otpRepository.deleteByUserId(user.getId());

        String otp = generateOtp();
        String otpHash = hashOtp(otp);
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60L);

        EmailVerificationOtp entity = new EmailVerificationOtp();
        entity.setUser(user);
        entity.setOtpHash(otpHash);
        entity.setExpiresAt(expiresAt);
        otpRepository.save(entity);

        sendOtpEmailToAddress(normalizedNewEmail, user.getUsername(), otp);
    }

    /**
     * Verify OTP for email change. newEmail comes from frontend (the email they requested to change to).
     * Updates user email only on success, sends EMAIL_CHANGE to old email.
     */
    @Transactional
    public void verifyOtpForEmailChange(UUID userId, String newEmail, String otp) {
        String normalizedNewEmail = normalizeEmail(newEmail);
        if (normalizedNewEmail.isBlank()) {
            throw new BadRequestException("Invalid email");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (userRepository.findByEmail(normalizedNewEmail).filter(u -> !u.getId().equals(userId)).isPresent()) {
            throw new BadRequestException("Email already in use");
        }

        EmailVerificationOtp otpEntity = otpRepository.findFirstByUserIdOrderByCreatedAtDesc(userId)
            .orElseThrow(() -> new BadRequestException("Invalid or expired verification code"));

        if (otpEntity.getTargetEmailHash() == null || otpEntity.getTargetEmailHash().isEmpty()) {
            throw new BadRequestException("Invalid or expired verification code");
        }
        if (!otpEntity.getTargetEmailHash().equals(hashEmail(normalizedNewEmail))) {
            throw new BadRequestException("Invalid or expired verification code");
        }

        if (Instant.now().isAfter(otpEntity.getExpiresAt())) {
            otpRepository.delete(otpEntity);
            throw new BadRequestException("Verification code has expired");
        }

        String inputHash = hashOtp(otp.trim());
        if (!inputHash.equals(otpEntity.getOtpHash())) {
            throw new BadRequestException("Invalid verification code");
        }

        String oldEmail = user.getEmail();
        if (oldEmail != null && !oldEmail.isBlank()) {
            try {
                emailNotificationService.sendEmailChangeNotification(user.getId(), normalizedNewEmail);
            } catch (Exception e) {
                // Non-fatal: will update email regardless
            }
        }

        user.setEmail(normalizedNewEmail);
        user.setEmailVerified(true);
        userRepository.save(user);
        otpRepository.deleteByUserId(user.getId());
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email already verified");
        }

        EmailVerificationOtp otpEntity = otpRepository.findFirstByUserIdAndTargetEmailHashIsNullOrderByCreatedAtDesc(user.getId())
            .orElseThrow(() -> new BadRequestException("Invalid or expired verification code"));

        if (Instant.now().isAfter(otpEntity.getExpiresAt())) {
            otpRepository.delete(otpEntity);
            throw new BadRequestException("Verification code has expired");
        }

        String inputHash = hashOtp(otp.trim());
        if (!inputHash.equals(otpEntity.getOtpHash())) {
            throw new BadRequestException("Invalid verification code");
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        otpRepository.deleteByUserId(user.getId());

        try {
            emailNotificationService.sendRegistrationConfirmation(user.getId(), null);
        } catch (Exception e) {
            // Non-fatal: verification succeeded
        }
    }

    private String generateOtp() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }

    private String hashOtp(String otp) {
        return hashSha256(otp);
    }

    private String hashEmail(String email) {
        return hashSha256(email);
    }

    private static String hashSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private void sendOtpEmail(User user, String otp) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        sendOtpEmailToAddress(user.getEmail(), user.getUsername(), otp);
    }

    private void sendOtpEmailToAddress(String recipientEmail, String firstName, String otp) {
        long templateId = brevoConfig.getTemplateId("EMAIL_VERIFICATION_OTP");
        if (templateId <= 0 || !brevoConfig.isConfigured()) {
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("otp", otp);
        params.put("first_name", firstName != null ? firstName : "there");
        params.put("expiry_minutes", OTP_EXPIRY_MINUTES);
        brevoMailClient.sendTransactionalEmail(recipientEmail, templateId, params);
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) return "";
        return email.trim().toLowerCase();
    }
}
