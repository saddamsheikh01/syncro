package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.Post;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, UUID> {

    @Query(
        value = """
            SELECT p.*
            FROM posts p
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
            ORDER BY p.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM posts p
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
            """,
        nativeQuery = true
    )
    Page<Post> findFeed(
        @Param("lat") Double lat,
        @Param("lng") Double lng,
        @Param("radiusKm") Double radiusKm,
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
