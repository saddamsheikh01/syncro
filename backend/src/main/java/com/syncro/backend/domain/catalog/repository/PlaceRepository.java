package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Place;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRepository extends JpaRepository<Place, UUID> {

    @Query(
        value = """
            SELECT p.*
            FROM places p
            WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:source IS NULL OR p.source = :source)
              AND (
                  :q IS NULL
                  OR p.name ILIKE CONCAT('%', :q, '%')
                  OR p.description ILIKE CONCAT('%', :q, '%')
              )
              AND (
                  :tagFilter = false
                  OR EXISTS (
                      SELECT 1
                      FROM place_tags pt
                      WHERE pt.place_id = p.id
                        AND pt.tag_id IN (:tagIds)
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
                  FROM place_tags pt
                  WHERE pt.place_id = p.id
                    AND pt.tag_id IN (:tagIds)
              ) THEN 1 ELSE 0 END DESC,
              CASE WHEN :categoryId IS NOT NULL AND p.category_id = :categoryId
                  THEN 1 ELSE 0 END DESC,
              CASE WHEN :lat IS NOT NULL AND :lng IS NOT NULL
                    AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
                  6371 * acos(least(1, greatest(-1,
                      cos(radians(:lat)) * cos(radians(p.latitude))
                      * cos(radians(p.longitude) - radians(:lng))
                      + sin(radians(:lat)) * sin(radians(p.latitude))
                  )))
              END ASC NULLS LAST,
              p.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM places p
            WHERE (:categoryId IS NULL OR p.category_id = :categoryId)
              AND (:source IS NULL OR p.source = :source)
              AND (
                  :q IS NULL
                  OR p.name ILIKE CONCAT('%', :q, '%')
                  OR p.description ILIKE CONCAT('%', :q, '%')
              )
              AND (
                  :tagFilter = false
                  OR EXISTS (
                      SELECT 1
                      FROM place_tags pt
                      WHERE pt.place_id = p.id
                        AND pt.tag_id IN (:tagIds)
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
    Page<Place> searchPlaces(
        @Param("categoryId") UUID categoryId,
        @Param("tagIds") List<UUID> tagIds,
        @Param("tagFilter") boolean tagFilter,
        @Param("lat") Double lat,
        @Param("lng") Double lng,
        @Param("radiusKm") Double radiusKm,
        @Param("q") String q,
        @Param("source") String source,
        Pageable pageable
    );

    // Metodi per Google Maps
    Optional<Place> findByGooglePlaceId(String googlePlaceId);

    List<Place> findByIsActiveTrue();

    Page<Place> findByIsActiveTrue(Pageable pageable);

    List<Place> findByCity(String city);

    List<Place> findByCityAndIsActiveTrue(String city);

    long countByGooglePlaceIdIsNotNull();

    long countByIsActiveTrue();

    /**
     * Conta i luoghi Google sincronizzati nell'area dopo una certa data.
     */
    @Query(
        value = """
            SELECT COUNT(*)
            FROM places p
            WHERE p.source = 'GOOGLE'
              AND p.last_synced_at >= :since
              AND p.latitude IS NOT NULL
              AND p.longitude IS NOT NULL
              AND (
                  6371 * acos(least(1, greatest(-1,
                      cos(radians(:lat)) * cos(radians(p.latitude))
                      * cos(radians(p.longitude) - radians(:lng))
                      + sin(radians(:lat)) * sin(radians(p.latitude))
                  )))
              ) <= :radiusKm
            """,
        nativeQuery = true
    )
    long countGooglePlacesInAreaSyncedAfter(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusKm") double radiusKm,
        @Param("since") Instant since
    );
}
