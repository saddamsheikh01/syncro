package com.syncro.backend.domain.tests.repository;

import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserTestAnswerRepository extends JpaRepository<UserTestAnswer, UUID> {

    boolean existsByQuestion_Id(UUID questionId);

    boolean existsByAnswerOption_Id(UUID answerOptionId);

    List<UserTestAnswer> findBySubmission_IdIn(Collection<UUID> submissionIds);

    List<UserTestAnswer> findBySubmission_Id(UUID submissionId);

    @Transactional
    @Modifying
    @Query("DELETE FROM UserTestAnswer a WHERE a.submission.id = :submissionId")
    void deleteBySubmissionId(@Param("submissionId") UUID submissionId);
}
