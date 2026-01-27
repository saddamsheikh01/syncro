package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTestSubmissionRepository extends JpaRepository<UserTestSubmission, UUID> {

    boolean existsByTestDefinitionId(UUID testId);

    @Query("""
        select count(distinct s.testDefinition.id)
        from UserTestSubmission s
        where s.user.id = :userId
        """)
    long countDistinctTestDefinitionIdByUserId(@Param("userId") UUID userId);
}
