package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.UserPasswordResetToken;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPasswordResetTokenRepository extends JpaRepository<UserPasswordResetToken, UUID> {

    Optional<UserPasswordResetToken> findByTokenHashAndUsedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);

    void deleteByUserIdAndUsedAtIsNullAndExpiresAtAfter(UUID userId, Instant now);
}
