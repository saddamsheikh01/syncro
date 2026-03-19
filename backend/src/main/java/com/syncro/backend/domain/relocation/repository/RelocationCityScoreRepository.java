package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationCityScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RelocationCityScoreRepository extends JpaRepository<RelocationCityScore, UUID> {

    List<RelocationCityScore> findByUserIdAndSnapshotIdOrderByRankingPositionAsc(UUID userId, UUID snapshotId);

    List<RelocationCityScore> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<RelocationCityScore> findByUserIdAndSnapshotIdAndCityId(UUID userId, UUID snapshotId, UUID cityId);

    List<RelocationCityScore> findBySnapshotIdOrderByRankingPositionAsc(UUID snapshotId);

    List<RelocationCityScore> findByUserIdAndAnalysisTypeOrderByCreatedAtDesc(UUID userId, String analysisType);

    List<RelocationCityScore> findByAnonymousSession_IdOrderByCreatedAtDesc(UUID anonymousSessionId);

    List<RelocationCityScore> findByAnonymousSession_IdAndSnapshot_IdOrderByRankingPositionAsc(
            UUID anonymousSessionId, UUID snapshotId);
}
