package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTestSubmissionRepository extends JpaRepository<UserTestSubmission, UUID> {

    boolean existsByTestDefinitionId(UUID testId);

    List<UserTestSubmission> findByUser_Id(UUID userId);

    @Query("""
        select count(distinct s.testDefinition.id)
        from UserTestSubmission s
        where s.user.id = :userId
        """)
    long countDistinctTestDefinitionIdByUserId(@Param("userId") UUID userId);

    List<UserTestSubmission> findByUser_IdOrderBySubmittedAtDesc(UUID userId);

    boolean existsByUser_IdAndTestDefinition_Id(UUID userId, UUID testId);

    java.util.Optional<UserTestSubmission> findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(
        UUID userId,
        UUID testId
    );

    @Query("""
        select distinct s.testDefinition.id
        from UserTestSubmission s
        where s.user.id = :userId
        """)
    List<UUID> findDistinctTestDefinitionIdsByUserId(@Param("userId") UUID userId);

    @Query("""
        select s.user.id as userId, count(distinct s.testDefinition.id) as count
        from UserTestSubmission s
        where s.user.id in :userIds
        group by s.user.id
        """)
    List<UserIdCountProjection> countDistinctTestDefinitionIdsByUserIds(
        @Param("userIds") Collection<UUID> userIds
    );

    List<UserTestSubmission> findBySubmittedAtBefore(Instant before);

    Page<UserTestSubmission> findBySubmittedAtBefore(Instant before, Pageable pageable);

    @Query("SELECT DISTINCT s.user.id FROM UserTestSubmission s")
    List<UUID> findDistinctUserIds();
}
