package com.syncro.backend.domain.feedback.repository;

import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedback;
import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedbackSource;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EarlyAccessFeedbackRepository extends JpaRepository<EarlyAccessFeedback, UUID> {

    Optional<EarlyAccessFeedback> findByUserIdAndSource(UUID userId, EarlyAccessFeedbackSource source);
}
