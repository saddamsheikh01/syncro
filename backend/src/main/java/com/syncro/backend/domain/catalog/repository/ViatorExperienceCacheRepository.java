package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.ViatorExperienceCache;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ViatorExperienceCacheRepository extends JpaRepository<ViatorExperienceCache, UUID> {

    Optional<ViatorExperienceCache> findByCacheKey(String cacheKey);

    @Modifying
    @Query("DELETE FROM ViatorExperienceCache c WHERE c.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM ViatorExperienceCache c WHERE c.cacheKey LIKE :prefix%")
    int deleteByCacheKeyPrefix(@Param("prefix") String prefix);
}
