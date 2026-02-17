package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestAnswerOptionTranslation;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestAnswerOptionTranslationRepository extends JpaRepository<TestAnswerOptionTranslation, UUID> {

    Optional<TestAnswerOptionTranslation> findByOption_IdAndLocale(UUID optionId, String locale);

    List<TestAnswerOptionTranslation> findByOption_IdInAndLocale(
        Collection<UUID> optionIds,
        String locale
    );

    List<TestAnswerOptionTranslation> findByOption_IdInAndLocaleIn(
        Collection<UUID> optionIds,
        Collection<String> locales
    );
}
