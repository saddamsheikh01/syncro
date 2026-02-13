package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.Post;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query("select distinct p.userId from Post p where p.userId in :userIds")
    List<UUID> findDistinctUserIdsByUserIdIn(@Param("userIds") Collection<UUID> userIds);

    @Query(
        value = """
            SELECT p.*
            FROM posts p
            JOIN user_profiles up ON up.user_id = p.user_id
            WHERE (
                :lat IS NULL
                OR :lng IS NULL
                OR :radiusKm IS NULL
                OR (
                    p.latitude IS NOT NULL
                    AND p.longitude IS NOT NULL
                    AND (
                        6371 * acos(least(1, greatest(-1,
                            cos(radians(:lat)) * cos(radians(p.latitude))
                            * cos(radians(p.longitude) - radians(:lng))
                            + sin(radians(:lat)) * sin(radians(p.latitude))
                        )))
                    ) <= :radiusKm
                )
            )
            AND (up.visibility IS NULL OR up.visibility <> 'PRIVATE')
            AND (:scope IS NULL OR p.scope = :scope)
            AND (:mood IS NULL OR p.mood = :mood)
            AND (:timeframe IS NULL OR p.timeframe = :timeframe)
            AND (
                :city IS NULL
                OR (up.city IS NOT NULL AND LOWER(up.city) LIKE LOWER(CONCAT('%', :city, '%')))
            )
            AND (:gender IS NULL OR up.gender = :gender)
            AND (
                :minAge IS NULL
                OR (up.birth_date IS NOT NULL AND EXTRACT(YEAR FROM age(current_date, up.birth_date)) >= :minAge)
            )
            AND (
                :maxAge IS NULL
                OR (up.birth_date IS NOT NULL AND EXTRACT(YEAR FROM age(current_date, up.birth_date)) <= :maxAge)
            )
            ORDER BY p.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM posts p
            JOIN user_profiles up ON up.user_id = p.user_id
            WHERE (
                :lat IS NULL
                OR :lng IS NULL
                OR :radiusKm IS NULL
                OR (
                    p.latitude IS NOT NULL
                    AND p.longitude IS NOT NULL
                    AND (
                        6371 * acos(least(1, greatest(-1,
                            cos(radians(:lat)) * cos(radians(p.latitude))
                            * cos(radians(p.longitude) - radians(:lng))
                            + sin(radians(:lat)) * sin(radians(p.latitude))
                        )))
                    ) <= :radiusKm
                )
            )
            AND (up.visibility IS NULL OR up.visibility <> 'PRIVATE')
            AND (:scope IS NULL OR p.scope = :scope)
            AND (:mood IS NULL OR p.mood = :mood)
            AND (:timeframe IS NULL OR p.timeframe = :timeframe)
            AND (
                :city IS NULL
                OR (up.city IS NOT NULL AND LOWER(up.city) LIKE LOWER(CONCAT('%', :city, '%')))
            )
            AND (:gender IS NULL OR up.gender = :gender)
            AND (
                :minAge IS NULL
                OR (up.birth_date IS NOT NULL AND EXTRACT(YEAR FROM age(current_date, up.birth_date)) >= :minAge)
            )
            AND (
                :maxAge IS NULL
                OR (up.birth_date IS NOT NULL AND EXTRACT(YEAR FROM age(current_date, up.birth_date)) <= :maxAge)
            )
            """,
        nativeQuery = true
    )
    Page<Post> findFeed(
        @Param("lat") Double lat,
        @Param("lng") Double lng,
        @Param("radiusKm") Double radiusKm,
        @Param("scope") String scope,
        @Param("mood") String mood,
        @Param("timeframe") String timeframe,
        @Param("city") String city,
        @Param("gender") String gender,
        @Param("minAge") Integer minAge,
        @Param("maxAge") Integer maxAge,
        Pageable pageable
    );

    @Query(
        value = """
            SELECT p.*
            FROM posts p
            WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY p.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM posts p
            WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%'))
            """,
        nativeQuery = true
    )
    Page<Post> searchByContent(@Param("q") String q, Pageable pageable);

    Page<Post> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
