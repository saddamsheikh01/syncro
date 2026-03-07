package com.syncro.backend.domain.zyra.repository;

import com.syncro.backend.domain.zyra.entity.ProfileRecapPendingRefresh;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Entity PK is user_id; use findById(userId) for lookups. */
public interface ProfileRecapPendingRefreshRepository extends JpaRepository<ProfileRecapPendingRefresh, UUID> {}
