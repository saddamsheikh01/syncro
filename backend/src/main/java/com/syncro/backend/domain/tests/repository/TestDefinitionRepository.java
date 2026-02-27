package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestDefinition;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestDefinitionRepository extends JpaRepository<TestDefinition, UUID> {

    List<TestDefinition> findByActiveTrueOrderByCreatedAtDesc();

    long countByActiveTrue();

    Optional<TestDefinition> findByIdAndActiveTrue(UUID id);

    List<TestDefinition> findAllByOrderByCreatedAtDesc();
}
