package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.profile.entity.UserPosition;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPositionRepository extends JpaRepository<UserPosition, UUID> {

    Optional<UserPosition> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
