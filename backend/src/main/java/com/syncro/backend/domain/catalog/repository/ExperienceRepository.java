package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.Experience;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
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
            LEFT JOIN viator_destination_refs vdr ON vdr.destination_ref = e.location_name
              AND vdr.enabled = true
            WHERE (e.is_active = true OR e.is_active IS NULL)
              AND (:source IS NULL OR e.source = :source)
              AND (:categoryId IS NULL OR e.category_id = :categoryId)
              AND (
                  :q IS NULL
                  OR (p.city ILIKE CONCAT('%', :q, '%')
                      OR (e.location_name IS NOT NULL AND e.location_name ILIKE CONCAT('%', :q, '%'))
                      OR (vdr.city_name IS NOT NULL AND vdr.city_name ILIKE CONCAT('%', :q, '%')))
                  OR ((e.name ILIKE CONCAT('%', :q, '%') OR e.description ILIKE CONCAT('%', :q, '%'))
                      AND (
                        (p.city IS NULL AND e.location_name IS NULL AND vdr.id IS NULL)
                        OR (p.city ILIKE CONCAT('%', :q, '%'))
                        OR (e.location_name ILIKE CONCAT('%', :q, '%'))
                        OR (vdr.city_name ILIKE CONCAT('%', :q, '%'))
                      ))
              )
              AND (
                  :locationRefFilter = false
                  OR e.location_name IN (:locationRefs)
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
                      COALESCE(e.latitude, p.latitude) IS NOT NULL
                      AND COALESCE(e.longitude, p.longitude) IS NOT NULL
                      AND (
                          6371 * acos(least(1, greatest(-1,
                              cos(radians(:lat)) * cos(radians(COALESCE(e.latitude, p.latitude)))
                              * cos(radians(COALESCE(e.longitude, p.longitude)) - radians(:lng))
                              + sin(radians(:lat)) * sin(radians(COALESCE(e.latitude, p.latitude)))
                          )))
                      ) <= :radiusKm
                  )
              )
              AND (:locale IS NULL OR (e.locale IS NOT NULL AND e.locale = :locale))
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
                    AND COALESCE(e.latitude, p.latitude) IS NOT NULL
                    AND COALESCE(e.longitude, p.longitude) IS NOT NULL THEN
                  6371 * acos(least(1, greatest(-1,
                      cos(radians(:lat)) * cos(radians(COALESCE(e.latitude, p.latitude)))
                      * cos(radians(COALESCE(e.longitude, p.longitude)) - radians(:lng))
                      + sin(radians(:lat)) * sin(radians(COALESCE(e.latitude, p.latitude)))
                  )))
              END ASC NULLS LAST,
              e.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(DISTINCT e.id)
            FROM experiences e
            LEFT JOIN places p ON e.place_id = p.id
            LEFT JOIN viator_destination_refs vdr ON vdr.destination_ref = e.location_name
              AND vdr.enabled = true
            WHERE (e.is_active = true OR e.is_active IS NULL)
              AND (:source IS NULL OR e.source = :source)
              AND (:categoryId IS NULL OR e.category_id = :categoryId)
              AND (
                  :q IS NULL
                  OR (p.city ILIKE CONCAT('%', :q, '%')
                      OR (e.location_name IS NOT NULL AND e.location_name ILIKE CONCAT('%', :q, '%'))
                      OR (vdr.city_name IS NOT NULL AND vdr.city_name ILIKE CONCAT('%', :q, '%')))
                  OR ((e.name ILIKE CONCAT('%', :q, '%') OR e.description ILIKE CONCAT('%', :q, '%'))
                      AND (
                        (p.city IS NULL AND e.location_name IS NULL AND vdr.id IS NULL)
                        OR (p.city ILIKE CONCAT('%', :q, '%'))
                        OR (e.location_name ILIKE CONCAT('%', :q, '%'))
                        OR (vdr.city_name ILIKE CONCAT('%', :q, '%'))
                      ))
              )
              AND (
                  :locationRefFilter = false
                  OR e.location_name IN (:locationRefs)
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
                      COALESCE(e.latitude, p.latitude) IS NOT NULL
                      AND COALESCE(e.longitude, p.longitude) IS NOT NULL
                      AND (
                          6371 * acos(least(1, greatest(-1,
                              cos(radians(:lat)) * cos(radians(COALESCE(e.latitude, p.latitude)))
                              * cos(radians(COALESCE(e.longitude, p.longitude)) - radians(:lng))
                              + sin(radians(:lat)) * sin(radians(COALESCE(e.latitude, p.latitude)))
                          )))
                      ) <= :radiusKm
                  )
              )
              AND (:locale IS NULL OR (e.locale IS NOT NULL AND e.locale = :locale))
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
        @Param("locationRefs") List<String> locationRefs,
        @Param("locationRefFilter") boolean locationRefFilter,
        @Param("source") String source,
        @Param("locale") String locale,
        Pageable pageable
    );

    // Metodi per provider esterni
    Optional<Experience> findByProviderAndExternalId(String provider, String externalId);

    Optional<Experience> findByProviderAndExternalIdAndLocale(String provider, String externalId, String locale);

    List<Experience> findByProviderAndIsActiveTrue(String provider);

    List<Experience> findByProvider(String provider);

    Page<Experience> findByIsActiveTrue(Pageable pageable);

    long countByProvider(String provider);

    long countByProviderAndIsActiveTrue(String provider);

    @Query("""
        SELECT e FROM Experience e
        LEFT JOIN e.place p
        WHERE (e.isActive = true OR e.isActive IS NULL)
          AND e.updatedAt >= :since
          AND (p.city IS NOT NULL AND LOWER(TRIM(p.city)) = LOWER(TRIM(:city))
               OR (e.locationName IS NOT NULL AND LOWER(e.locationName) LIKE LOWER(CONCAT('%', :city, '%'))))
        ORDER BY e.updatedAt DESC
        """)
    List<Experience> findActiveByCityUpdatedSince(
        @Param("city") String city,
        @Param("since") Instant since,
        Pageable pageable
    );
}
