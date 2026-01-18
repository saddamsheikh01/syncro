package com.syncro.backend.domain.tests.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestAnswerOptionUpdateRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestDefinitionUpdateRequest;
import com.syncro.backend.domain.tests.dto.AdminTestDetailResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionRequest;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionResponse;
import com.syncro.backend.domain.tests.dto.AdminTestQuestionUpdateRequest;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.mapper.TestMapper;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminTestService {

    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final TestMapper testMapper;

    public AdminTestService(
        TestDefinitionRepository testDefinitionRepository,
        TestQuestionRepository testQuestionRepository,
        TestAnswerOptionRepository testAnswerOptionRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        TestMapper testMapper
    ) {
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.testMapper = testMapper;
    }

    @Transactional(readOnly = true)
    public List<AdminTestDefinitionResponse> getTests(AdminPrincipal principal) {
        ensureSuperAdmin(principal);
        return testDefinitionRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(testMapper::toAdminDefinitionResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public AdminTestDetailResponse getTest(AdminPrincipal principal, UUID testId) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        return testMapper.toAdminDetailResponse(definition, questions, optionsByQuestion);
    }

    @Transactional
    public AdminTestDefinitionResponse createTest(AdminPrincipal principal, AdminTestDefinitionRequest request) {
        ensureSuperAdmin(principal);
        TestDefinition definition = new TestDefinition();
        definition.setTitle(normalizeRequired(request.title()));
        definition.setDescription(normalizeOptional(request.description()));
        definition.setActive(request.active() != null ? request.active() : true);
        if (request.testType() != null) {
            definition.setTestType(request.testType());
        }
        if (request.scoringStrategy() != null) {
            definition.setScoringStrategy(request.scoringStrategy());
        }
        if (request.config() != null) {
            definition.setConfig(request.config());
        }
        TestDefinition saved = testDefinitionRepository.save(definition);
        return testMapper.toAdminDefinitionResponse(saved);
    }

    @Transactional
    public AdminTestDefinitionResponse updateTest(
        AdminPrincipal principal,
        UUID testId,
        AdminTestDefinitionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        if (request.title() != null) {
            definition.setTitle(normalizeRequired(request.title()));
        }
        if (request.description() != null) {
            definition.setDescription(normalizeOptional(request.description()));
        }
        if (request.active() != null) {
            definition.setActive(request.active());
        }
        if (request.testType() != null) {
            definition.setTestType(request.testType());
        }
        if (request.scoringStrategy() != null) {
            definition.setScoringStrategy(request.scoringStrategy());
        }
        if (request.config() != null) {
            definition.setConfig(request.config());
        }
        TestDefinition saved = testDefinitionRepository.save(definition);
        return testMapper.toAdminDefinitionResponse(saved);
    }

    @Transactional
    public void deleteTest(AdminPrincipal principal, UUID testId) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        if (userTestSubmissionRepository.existsByTestDefinitionId(definition.getId())) {
            throw new ConflictException("Test gia utilizzato");
        }
        testDefinitionRepository.delete(definition);
    }

    @Transactional
    public AdminTestQuestionResponse createQuestion(
        AdminPrincipal principal,
        UUID testId,
        AdminTestQuestionRequest request
    ) {
        ensureSuperAdmin(principal);
        TestDefinition definition = getDefinition(testId);
        TestQuestion question = new TestQuestion();
        question.setTestDefinition(definition);
        question.setQuestion(normalizeRequired(request.question()));
        question.setPosition(request.position());
        if (request.questionType() != null) {
            question.setQuestionType(request.questionType());
        }
        if (request.required() != null) {
            question.setRequired(request.required());
        }
        if (request.maxSelections() != null) {
            question.setMaxSelections(request.maxSelections());
        }
        TestQuestion saved = testQuestionRepository.save(question);
        return testMapper.toAdminQuestionResponse(saved);
    }

    @Transactional
    public AdminTestQuestionResponse updateQuestion(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        AdminTestQuestionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        if (request.question() != null) {
            question.setQuestion(normalizeRequired(request.question()));
        }
        if (request.position() != null) {
            question.setPosition(request.position());
        }
        if (request.questionType() != null) {
            question.setQuestionType(request.questionType());
        }
        if (request.required() != null) {
            question.setRequired(request.required());
        }
        if (request.maxSelections() != null) {
            question.setMaxSelections(request.maxSelections());
        }
        TestQuestion saved = testQuestionRepository.save(question);
        return testMapper.toAdminQuestionResponse(saved);
    }

    @Transactional
    public void deleteQuestion(AdminPrincipal principal, UUID testId, UUID questionId) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        if (userTestAnswerRepository.existsByQuestion_Id(question.getId())) {
            throw new ConflictException("Domanda gia utilizzata");
        }
        testQuestionRepository.delete(question);
    }

    @Transactional
    public AdminTestAnswerOptionResponse createAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        AdminTestAnswerOptionRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = new TestAnswerOption();
        option.setQuestion(question);
        option.setLabel(normalizeRequired(request.label()));
        option.setWeight(request.weight());
        if (request.metadata() != null) {
            option.setMetadata(request.metadata());
        }
        TestAnswerOption saved = testAnswerOptionRepository.save(option);
        return testMapper.toAdminAnswerOptionResponse(saved);
    }

    @Transactional
    public AdminTestAnswerOptionResponse updateAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        UUID optionId,
        AdminTestAnswerOptionUpdateRequest request
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = testAnswerOptionRepository.findByIdAndQuestion_Id(optionId, question.getId())
            .orElseThrow(() -> new NotFoundException("Opzione non trovata"));
        if (request.label() != null) {
            option.setLabel(normalizeRequired(request.label()));
        }
        if (request.weight() != null) {
            option.setWeight(request.weight());
        }
        if (request.metadata() != null) {
            option.setMetadata(request.metadata());
        }
        TestAnswerOption saved = testAnswerOptionRepository.save(option);
        return testMapper.toAdminAnswerOptionResponse(saved);
    }

    @Transactional
    public void deleteAnswerOption(
        AdminPrincipal principal,
        UUID testId,
        UUID questionId,
        UUID optionId
    ) {
        ensureSuperAdmin(principal);
        TestQuestion question = getQuestion(testId, questionId);
        TestAnswerOption option = testAnswerOptionRepository.findByIdAndQuestion_Id(optionId, question.getId())
            .orElseThrow(() -> new NotFoundException("Opzione non trovata"));
        if (userTestAnswerRepository.existsByAnswerOption_Id(option.getId())) {
            throw new ConflictException("Opzione gia utilizzata");
        }
        testAnswerOptionRepository.delete(option);
    }

    private TestDefinition getDefinition(UUID testId) {
        return testDefinitionRepository.findById(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
    }

    private TestQuestion getQuestion(UUID testId, UUID questionId) {
        return testQuestionRepository.findByIdAndTestDefinitionId(questionId, testId)
            .orElseThrow(() -> new NotFoundException("Domanda non trovata"));
    }

    private void ensureSuperAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        if (!AdminRole.SUPER_ADMIN.name().equals(principal.role())) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null || normalized.isBlank()) {
            throw new BadRequestException("Valore non valido");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private Map<UUID, List<TestAnswerOption>> loadOptionsByQuestion(List<TestQuestion> questions) {
        if (questions.isEmpty()) {
            return Map.of();
        }
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = testAnswerOptionRepository
            .findByQuestion_IdIn(questionIds)
            .stream()
            .collect(Collectors.groupingBy(option -> option.getQuestion().getId()));
        optionsByQuestion.values()
            .forEach(options -> options.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt())));
        return optionsByQuestion;
    }
}
