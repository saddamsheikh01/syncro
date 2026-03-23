package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {
    Optional<UserSubscription> findFirstByUser_IdAndStatusOrderByCreatedAtDesc(UUID userId, String status);
}
