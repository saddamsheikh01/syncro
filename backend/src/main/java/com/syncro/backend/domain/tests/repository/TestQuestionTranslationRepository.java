package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.TestQuestionTranslation;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestQuestionTranslationRepository extends JpaRepository<TestQuestionTranslation, UUID> {

    Optional<TestQuestionTranslation> findByQuestion_IdAndLocale(UUID questionId, String locale);

    List<TestQuestionTranslation> findByQuestion_IdInAndLocale(
        Collection<UUID> questionIds,
        String locale
    );

    List<TestQuestionTranslation> findByQuestion_IdInAndLocaleIn(
        Collection<UUID> questionIds,
        Collection<String> locales
    );
}
