package com.syncro.backend.domain.matchmaking.repository;

import com.syncro.backend.domain.matchmaking.entity.PlaceRecommendationScore;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRecommendationScoreRepository extends JpaRepository<PlaceRecommendationScore, UUID> {

    Page<PlaceRecommendationScore> findByUserId(UUID userId, Pageable pageable);

    Page<PlaceRecommendationScore> findByUserIdAndPlaceIdIsNotNull(UUID userId, Pageable pageable);

    Page<PlaceRecommendationScore> findByUserIdAndExperienceIdIsNotNull(UUID userId, Pageable pageable);

    Optional<PlaceRecommendationScore> findByUserIdAndPlaceId(UUID userId, UUID placeId);

    Optional<PlaceRecommendationScore> findByUserIdAndExperienceId(UUID userId, UUID experienceId);

    @Query(
        value = """
            SELECT pt.place_id as placeId, COUNT(*) as sharedCount
            FROM place_tags pt
            WHERE pt.tag_id IN (:tagIds)
            GROUP BY pt.place_id
            ORDER BY sharedCount DESC
            LIMIT :limit
            """,
        nativeQuery = true
    )
    List<PlaceCandidateProjection> findPlaceCandidates(
        @Param("tagIds") List<UUID> tagIds,
        @Param("limit") int limit
    );

    @Query(
        value = """
            SELECT et.experience_id as experienceId, COUNT(*) as sharedCount
            FROM experience_tags et
            WHERE et.tag_id IN (:tagIds)
            GROUP BY et.experience_id
            ORDER BY sharedCount DESC
            LIMIT :limit
            """,
        nativeQuery = true
    )
    List<ExperienceCandidateProjection> findExperienceCandidates(
        @Param("tagIds") List<UUID> tagIds,
        @Param("limit") int limit
    );
}
