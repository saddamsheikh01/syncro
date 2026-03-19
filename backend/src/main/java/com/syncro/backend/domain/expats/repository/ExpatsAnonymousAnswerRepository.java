package com.syncro.backend.domain.expats.repository;

import com.syncro.backend.domain.expats.entity.ExpatsAnonymousAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpatsAnonymousAnswerRepository extends JpaRepository<ExpatsAnonymousAnswer, UUID> {

    List<ExpatsAnonymousAnswer> findBySessionIdOrderByStepNumberAsc(UUID sessionId);

    Optional<ExpatsAnonymousAnswer> findBySessionIdAndQuestionKey(UUID sessionId, String questionKey);

    int countBySessionId(UUID sessionId);
}
