package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestAnswerOptionRepository extends JpaRepository<TestAnswerOption, UUID> {

    List<TestAnswerOption> findByQuestionIdIn(Collection<UUID> questionIds);

    List<TestAnswerOption> findByQuestionIdOrderByCreatedAtAsc(UUID questionId);

    Optional<TestAnswerOption> findByIdAndQuestionId(UUID id, UUID questionId);
}
