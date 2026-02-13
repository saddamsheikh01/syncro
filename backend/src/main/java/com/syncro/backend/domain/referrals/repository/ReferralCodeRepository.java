package com.syncro.backend.domain.referrals.repository;

import com.syncro.backend.domain.referrals.entity.ReferralCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReferralCodeRepository extends JpaRepository<ReferralCode, UUID> {

    Optional<ReferralCode> findByUserId(UUID userId);

    Optional<ReferralCode> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        select rc from ReferralCode rc
        where (:q is null
           or lower(rc.code) like lower(concat('%', :q, '%'))
           or lower(rc.user.email) like lower(concat('%', :q, '%'))
           or lower(rc.user.username) like lower(concat('%', :q, '%'))
        )
        """)
    Page<ReferralCode> searchAdmin(@Param("q") String q, Pageable pageable);
}
