package com.syncro.backend.domain.profile.repository;

import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {

    Optional<UserProfile> findByUserId(UUID userId);

    java.util.List<UserProfile> findByUserIdIn(Collection<UUID> userIds);

    boolean existsByUserId(UUID userId);

    @Query("""
        SELECT p FROM UserProfile p
        WHERE p.visibility = :visibility
          AND (LOWER(p.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(p.city) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY p.fullName
        """)
    Page<UserProfile> searchByNameOrCity(
        @Param("q") String q,
        @Param("visibility") ProfileVisibility visibility,
        Pageable pageable
    );
}
