package com.syncro.backend.domain.email.repository;

import com.syncro.backend.domain.email.entity.UserEmailPreference;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserEmailPreferenceRepository extends JpaRepository<UserEmailPreference, UUID> {
    Optional<UserEmailPreference> findByUserId(UUID userId);

    List<UserEmailPreference> findByDigestEnabledTrue();

    List<UserEmailPreference> findByContentWeeklyDigestTrue();
}
