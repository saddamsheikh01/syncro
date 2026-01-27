package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTestAnswerRepository extends JpaRepository<UserTestAnswer, UUID> {

    boolean existsByQuestion_Id(UUID questionId);

    boolean existsByAnswerOption_Id(UUID answerOptionId);

    List<UserTestAnswer> findBySubmission_IdIn(Collection<UUID> submissionIds);
}
