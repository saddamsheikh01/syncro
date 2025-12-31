package com.syncro.backend.domain.tests.mapper;

import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionDetailResponse;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestDetailResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionDetailResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionResponse;
import com.syncro.backend.domain.tests.dto.TestAnswerOptionResponse;
import com.syncro.backend.domain.tests.dto.TestDetailResponse;
import com.syncro.backend.domain.tests.dto.TestQuestionResponse;
import com.syncro.backend.domain.tests.dto.TestSummaryResponse;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class TestMapper {

    public TestSummaryResponse toSummaryResponse(TestDefinition definition) {
        return new TestSummaryResponse(
            definition.getId(),
            definition.getTitle(),
            definition.getDescription()
        );
    }

    public TestDetailResponse toDetailResponse(
        TestDefinition definition,
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion
    ) {
        List<TestQuestionResponse> questionResponses = questions.stream()
            .map(question -> new TestQuestionResponse(
                question.getId(),
                question.getQuestion(),
                question.getPosition(),
                optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                    .map(option -> new TestAnswerOptionResponse(option.getId(), option.getLabel()))
                    .toList()
            ))
            .toList();
        return new TestDetailResponse(
            definition.getId(),
            definition.getTitle(),
            definition.getDescription(),
            questionResponses
        );
    }

    public AdminTestDefinitionResponse toAdminDefinitionResponse(TestDefinition definition) {
        return new AdminTestDefinitionResponse(
            definition.getId(),
            definition.getTitle(),
            definition.getDescription(),
            definition.isActive(),
            definition.getCreatedAt(),
            definition.getUpdatedAt()
        );
    }

    public AdminTestDetailResponse toAdminDetailResponse(
        TestDefinition definition,
        List<TestQuestion> questions,
        Map<UUID, List<TestAnswerOption>> optionsByQuestion
    ) {
        List<AdminTestQuestionDetailResponse> questionResponses = questions.stream()
            .map(question -> new AdminTestQuestionDetailResponse(
                question.getId(),
                question.getQuestion(),
                question.getPosition(),
                optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                    .map(option -> new AdminTestAnswerOptionDetailResponse(
                        option.getId(),
                        option.getLabel(),
                        option.getWeight()
                    ))
                    .toList()
            ))
            .toList();
        return new AdminTestDetailResponse(
            definition.getId(),
            definition.getTitle(),
            definition.getDescription(),
            definition.isActive(),
            definition.getCreatedAt(),
            definition.getUpdatedAt(),
            questionResponses
        );
    }

    public AdminTestQuestionResponse toAdminQuestionResponse(TestQuestion question) {
        return new AdminTestQuestionResponse(
            question.getId(),
            question.getTestDefinition().getId(),
            question.getQuestion(),
            question.getPosition()
        );
    }

    public AdminTestAnswerOptionResponse toAdminAnswerOptionResponse(TestAnswerOption option) {
        return new AdminTestAnswerOptionResponse(
            option.getId(),
            option.getQuestion().getId(),
            option.getLabel(),
            option.getWeight()
        );
    }
}
