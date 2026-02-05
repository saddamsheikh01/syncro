package com.syncro.backend.domain.referrals.repository;

import com.syncro.backend.domain.referrals.entity.ReferralUsage;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralUsageRepository extends JpaRepository<ReferralUsage, UUID> {

    boolean existsByInvitedUserId(UUID invitedUserId);

    Page<ReferralUsage> findByReferralCodeIdOrderByCreatedAtDesc(UUID referralCodeId, Pageable pageable);
}
