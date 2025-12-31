package com.syncro.backend.domain.tests.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "user_test_answers")
@IdClass(UserTestAnswerId.class)
public class UserTestAnswer {

    @Id
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @Id
    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false, insertable = false, updatable = false)
    private UserTestSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, insertable = false, updatable = false)
    private TestQuestion question;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answer_option_id", nullable = false)
    private TestAnswerOption answerOption;

    public UUID getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(UUID submissionId) {
        this.submissionId = submissionId;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public void setQuestionId(UUID questionId) {
        this.questionId = questionId;
    }

    public UserTestSubmission getSubmission() {
        return submission;
    }

    public void setSubmission(UserTestSubmission submission) {
        this.submission = submission;
        this.submissionId = submission != null ? submission.getId() : null;
    }

    public TestQuestion getQuestion() {
        return question;
    }

    public void setQuestion(TestQuestion question) {
        this.question = question;
        this.questionId = question != null ? question.getId() : null;
    }

    public TestAnswerOption getAnswerOption() {
        return answerOption;
    }

    public void setAnswerOption(TestAnswerOption answerOption) {
        this.answerOption = answerOption;
    }
}
