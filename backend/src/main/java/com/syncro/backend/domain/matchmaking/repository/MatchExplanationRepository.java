package com.syncro.backend.domain.matchmaking.repository;

import com.syncro.backend.domain.matchmaking.entity.MatchExplanation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchExplanationRepository extends JpaRepository<MatchExplanation, UUID> {

    Optional<MatchExplanation> findByMatchId(UUID matchId);

    List<MatchExplanation> findAllByMatchIdIn(List<UUID> matchIds);
}
