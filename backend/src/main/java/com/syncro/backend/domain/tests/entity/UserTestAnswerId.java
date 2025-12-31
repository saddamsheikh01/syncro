package com.syncro.backend.domain.tests.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserTestAnswerId implements Serializable {

    private UUID submissionId;
    private UUID questionId;

    public UserTestAnswerId() {
    }

    public UserTestAnswerId(UUID submissionId, UUID questionId) {
        this.submissionId = submissionId;
        this.questionId = questionId;
    }

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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserTestAnswerId that = (UserTestAnswerId) o;
        return Objects.equals(submissionId, that.submissionId)
            && Objects.equals(questionId, that.questionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(submissionId, questionId);
    }
}
