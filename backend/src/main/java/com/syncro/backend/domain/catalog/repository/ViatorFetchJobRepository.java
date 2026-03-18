package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.ViatorFetchJob;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ViatorFetchJobRepository extends JpaRepository<ViatorFetchJob, UUID> {

    @Query("""
        SELECT j FROM ViatorFetchJob j
        WHERE j.cacheKey = :cacheKey AND j.status IN ('PENDING', 'RUNNING')
        ORDER BY j.createdAt ASC
        """)
    List<ViatorFetchJob> findPendingOrRunningByCacheKey(@Param("cacheKey") String cacheKey);

    @Query("""
        SELECT j FROM ViatorFetchJob j
        WHERE j.status = 'PENDING' AND j.retryCount < j.maxRetries
        ORDER BY j.createdAt ASC
        """)
    List<ViatorFetchJob> findNextPending(Pageable pageable);

    Optional<ViatorFetchJob> findById(UUID id);

    long countByStatus(String status);

    /** Delete only completed/failed jobs matching prefix — leaves PENDING/RUNNING untouched. */
    @Query("DELETE FROM ViatorFetchJob j WHERE j.cacheKey LIKE :prefix% AND j.status IN ('COMPLETED', 'FAILED')")
    @org.springframework.data.jpa.repository.Modifying
    int deleteCompletedOrFailedByCacheKeyPrefix(@Param("prefix") String prefix);
}
