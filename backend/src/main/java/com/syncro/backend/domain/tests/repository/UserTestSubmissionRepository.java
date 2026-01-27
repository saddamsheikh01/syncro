package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import java.util.List;
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

    List<UserTestSubmission> findByUser_IdOrderBySubmittedAtDesc(UUID userId);

    boolean existsByUser_IdAndTestDefinition_Id(UUID userId, UUID testId);

    @Query("""
        select distinct s.testDefinition.id
        from UserTestSubmission s
        where s.user.id = :userId
        """)
    List<UUID> findDistinctTestDefinitionIdsByUserId(@Param("userId") UUID userId);
}
