package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestQuestion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestQuestionRepository extends JpaRepository<TestQuestion, UUID> {

    List<TestQuestion> findByTestDefinitionIdOrderByPositionAsc(UUID testId);

    Optional<TestQuestion> findByIdAndTestDefinitionId(UUID id, UUID testId);
}
