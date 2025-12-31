package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPsyProfileRepository extends JpaRepository<UserPsyProfile, UUID> {

    Optional<UserPsyProfile> findByUserId(UUID userId);
}
