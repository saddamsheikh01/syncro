package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.EmailVerificationOtp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, UUID> {

    Optional<EmailVerificationOtp> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Initial verification OTPs only (target_email_hash IS NULL). */
    Optional<EmailVerificationOtp> findFirstByUserIdAndTargetEmailHashIsNullOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("DELETE FROM EmailVerificationOtp e WHERE e.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM EmailVerificationOtp e WHERE e.user.id = :userId")
    int deleteByUserId(@Param("userId") UUID userId);
}
