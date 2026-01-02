package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.Experience;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {

    @Query(
        value = """
            SELECT e.*
            FROM experiences e
            LEFT JOIN places p ON e.place_id = p.id
            WHERE (:categoryId IS NULL OR e.category_id = :categoryId)
              AND (
                  :q IS NULL
                  OR e.name ILIKE CONCAT('%', :q, '%')
                  OR e.description ILIKE CONCAT('%', :q, '%')
              )
              AND (
                  :tagFilter = false
                  OR EXISTS (
                      SELECT 1
                      FROM experience_tags et
                      WHERE et.experience_id = e.id
                        AND et.tag_id IN (:tagIds)
                  )
              )
              AND (
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
            ORDER BY
              CASE WHEN :tagFilter = true AND EXISTS (
                  SELECT 1
                  FROM experience_tags et
                  WHERE et.experience_id = e.id
                    AND et.tag_id IN (:tagIds)
              ) THEN 1 ELSE 0 END DESC,
              CASE WHEN :categoryId IS NOT NULL AND e.category_id = :categoryId
                  THEN 1 ELSE 0 END DESC,
              CASE WHEN :lat IS NOT NULL AND :lng IS NOT NULL
                    AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
                  6371 * acos(least(1, greatest(-1,
                      cos(radians(:lat)) * cos(radians(p.latitude))
                      * cos(radians(p.longitude) - radians(:lng))
                      + sin(radians(:lat)) * sin(radians(p.latitude))
                  )))
              END ASC NULLS LAST,
              e.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM experiences e
            LEFT JOIN places p ON e.place_id = p.id
            WHERE (:categoryId IS NULL OR e.category_id = :categoryId)
              AND (
                  :q IS NULL
                  OR e.name ILIKE CONCAT('%', :q, '%')
                  OR e.description ILIKE CONCAT('%', :q, '%')
              )
              AND (
                  :tagFilter = false
                  OR EXISTS (
                      SELECT 1
                      FROM experience_tags et
                      WHERE et.experience_id = e.id
                        AND et.tag_id IN (:tagIds)
                  )
              )
              AND (
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
    Page<Experience> searchExperiences(
        @Param("categoryId") UUID categoryId,
        @Param("tagIds") List<UUID> tagIds,
        @Param("tagFilter") boolean tagFilter,
        @Param("lat") Double lat,
        @Param("lng") Double lng,
        @Param("radiusKm") Double radiusKm,
        @Param("q") String q,
        Pageable pageable
    );
}
