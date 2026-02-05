package com.syncro.backend.domain.referrals.repository;

import com.syncro.backend.domain.referrals.entity.ReferralCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralCodeRepository extends JpaRepository<ReferralCode, UUID> {

    Optional<ReferralCode> findByUserId(UUID userId);

    Optional<ReferralCode> findByCode(String code);

    boolean existsByCode(String code);
}
