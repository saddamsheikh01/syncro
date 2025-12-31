package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTestSubmissionRepository extends JpaRepository<UserTestSubmission, UUID> {

    boolean existsByTestDefinitionId(UUID testId);
}
