package com.syncro.backend.domain.matchmaking.repository;

import com.syncro.backend.domain.matchmaking.entity.UserMatchScore;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserMatchScoreRepository extends JpaRepository<UserMatchScore, UUID> {

    Optional<UserMatchScore> findByUserAIdAndUserBId(UUID userAId, UUID userBId);

    @Query("select m from UserMatchScore m where m.userAId = :userId or m.userBId = :userId")
    Page<UserMatchScore> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query(
        value = """
            SELECT ui.user_id as userId, COUNT(*) as sharedCount
            FROM user_interests ui
            WHERE ui.tag_id IN (:tagIds)
              AND ui.user_id <> :userId
            GROUP BY ui.user_id
            ORDER BY sharedCount DESC
            LIMIT :limit
            """,
        nativeQuery = true
    )
    List<UserMatchCandidateProjection> findCandidates(
        @Param("userId") UUID userId,
        @Param("tagIds") List<UUID> tagIds,
        @Param("limit") int limit
    );
}
