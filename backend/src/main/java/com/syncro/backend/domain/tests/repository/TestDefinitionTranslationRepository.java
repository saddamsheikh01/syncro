package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestDefinitionTranslation;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestDefinitionTranslationRepository extends JpaRepository<TestDefinitionTranslation, UUID> {

    Optional<TestDefinitionTranslation> findByTestDefinition_IdAndLocale(UUID testId, String locale);

    List<TestDefinitionTranslation> findByTestDefinition_IdInAndLocaleIn(
        Collection<UUID> testIds,
        Collection<String> locales
    );
}
