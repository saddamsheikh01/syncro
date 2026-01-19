package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.profile.entity.UserProfile;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUserId(UUID userId);

    java.util.List<UserProfile> findByUserIdIn(Collection<UUID> userIds);

    boolean existsByUserId(UUID userId);
}
