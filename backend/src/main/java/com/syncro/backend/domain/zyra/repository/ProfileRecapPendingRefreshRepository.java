package com.syncro.backend.domain.zyra.repository;

import com.syncro.backend.domain.zyra.entity.ProfileRecapPendingRefresh;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRecapPendingRefreshRepository extends JpaRepository<ProfileRecapPendingRefresh, UUID> {

    Optional<ProfileRecapPendingRefresh> findByUserId(UUID userId);

    boolean existsByUserIdAndPendingRefreshTrue(UUID userId);
}
