package com.syncro.backend.domain.referrals.repository;

import com.syncro.backend.domain.referrals.entity.ReferralUsage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReferralUsageRepository extends JpaRepository<ReferralUsage, UUID> {

    boolean existsByInvitedUserId(UUID invitedUserId);

    Page<ReferralUsage> findByReferralCodeIdOrderByCreatedAtDesc(UUID referralCodeId, Pageable pageable);

    @Query("""
        select distinct ru.invitedUserId
        from ReferralUsage ru
        where ru.referralCodeId = :referralCodeId
        """)
    List<UUID> findDistinctInvitedUserIdsByReferralCodeId(
        @Param("referralCodeId") UUID referralCodeId
    );
}
