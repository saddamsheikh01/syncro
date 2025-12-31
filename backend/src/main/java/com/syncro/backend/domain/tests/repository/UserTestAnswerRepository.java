package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestAnswerId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTestAnswerRepository extends JpaRepository<UserTestAnswer, UserTestAnswerId> {

    boolean existsByQuestionId(UUID questionId);

    boolean existsByAnswerOptionId(UUID answerOptionId);
}
