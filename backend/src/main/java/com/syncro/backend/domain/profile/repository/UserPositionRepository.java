package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.profile.entity.UserPosition;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserPositionRepository extends JpaRepository<UserPosition, UUID> {

    Optional<UserPosition> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Query(value = """
        SELECT user_id FROM user_positions
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND (6371 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians(:lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:lon))
            + sin(radians(:lat)) * sin(radians(latitude)))))) <= :radiusKm
        """, nativeQuery = true)
    List<UUID> findUserIdsWithinRadius(
        @Param("lat") double latitude,
        @Param("lon") double longitude,
        @Param("radiusKm") double radiusKm
    );
}
