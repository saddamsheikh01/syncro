package com.syncro.backend.domain.tests.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.tests.dto.TestAnswerRequest;
import com.syncro.backend.domain.tests.dto.TestDetailResponse;
import com.syncro.backend.domain.tests.dto.TestListResponse;
import com.syncro.backend.domain.tests.dto.TestSubmissionRequest;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.mapper.TestMapper;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestService {

    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final UserTestSubmissionRepository userTestSubmissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final UserRepository userRepository;
    private final TestMapper testMapper;

    public TestService(
        TestDefinitionRepository testDefinitionRepository,
        TestQuestionRepository testQuestionRepository,
        TestAnswerOptionRepository testAnswerOptionRepository,
        UserTestSubmissionRepository userTestSubmissionRepository,
        UserTestAnswerRepository userTestAnswerRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        UserRepository userRepository,
        TestMapper testMapper
    ) {
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.userTestSubmissionRepository = userTestSubmissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.userRepository = userRepository;
        this.testMapper = testMapper;
    }

    @Transactional(readOnly = true)
    public TestListResponse getTests() {
        List<TestDefinition> tests = testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc();
        return new TestListResponse(tests.stream().map(testMapper::toSummaryResponse).toList());
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(UUID testId) {
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));
        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        return testMapper.toDetailResponse(definition, questions, optionsByQuestion);
    }

    @Transactional
    public void submitTest(UserPrincipal principal, UUID testId, TestSubmissionRequest request) {
        User user = getUser(principal);
        TestDefinition definition = testDefinitionRepository.findByIdAndActiveTrue(testId)
            .orElseThrow(() -> new NotFoundException("Test non trovato"));

        List<TestQuestion> questions = testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Test senza domande");
        }
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new BadRequestException("Risposte mancanti");
        }

        Set<UUID> expectedQuestionIds = questions.stream()
            .map(TestQuestion::getId)
            .collect(Collectors.toSet());
        Set<UUID> answeredQuestionIds = request.answers().stream()
            .map(answer -> answer.questionId())
            .collect(Collectors.toSet());
        if (answeredQuestionIds.size() != request.answers().size()) {
            throw new BadRequestException("Risposte duplicate");
        }
        if (!answeredQuestionIds.equals(expectedQuestionIds)) {
            throw new BadRequestException("Risposte non valide");
        }

        Map<UUID, List<TestAnswerOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        Map<UUID, TestAnswerOption> optionsById = optionsByQuestion.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toMap(TestAnswerOption::getId, Function.identity()));
        Map<UUID, TestQuestion> questionsById = questions.stream()
            .collect(Collectors.toMap(TestQuestion::getId, Function.identity()));

        int rawScore = 0;
        for (TestAnswerRequest answer : request.answers()) {
            TestAnswerOption option = optionsById.get(answer.answerOptionId());
            if (option == null || !option.getQuestion().getId().equals(answer.questionId())) {
                throw new BadRequestException("Risposte non valide");
            }
            rawScore += option.getWeight();
        }

        int minScore = 0;
        int maxScore = 0;
        for (TestQuestion question : questions) {
            List<TestAnswerOption> options = optionsByQuestion.get(question.getId());
            if (options == null || options.isEmpty()) {
                throw new BadRequestException("Domanda senza opzioni");
            }
            int min = options.stream().mapToInt(TestAnswerOption::getWeight).min().orElse(0);
            int max = options.stream().mapToInt(TestAnswerOption::getWeight).max().orElse(0);
            minScore += min;
            maxScore += max;
        }

        int normalizedScore = maxScore == minScore
            ? 0
            : (int) Math.round(100.0 * (rawScore - minScore) / (maxScore - minScore));
        normalizedScore = Math.max(0, Math.min(100, normalizedScore));

        UserTestSubmission submission = new UserTestSubmission();
        submission.setUser(user);
        submission.setTestDefinition(definition);
        UserTestSubmission savedSubmission = userTestSubmissionRepository.save(submission);

        List<UserTestAnswer> answers = request.answers().stream()
            .map(answer -> {
                UserTestAnswer entity = new UserTestAnswer();
                entity.setSubmission(savedSubmission);
                TestQuestion question = questionsById.get(answer.questionId());
                entity.setQuestion(question);
                entity.setAnswerOption(optionsById.get(answer.answerOptionId()));
                return entity;
            })
            .toList();
        userTestAnswerRepository.saveAll(answers);

        UserPsyProfile profile = userPsyProfileRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                UserPsyProfile created = new UserPsyProfile();
                created.setUser(user);
                return created;
            });
        Map<String, Object> profileData = profile.getProfile();
        if (profileData == null) {
            profileData = new HashMap<>();
        }
        Map<String, Object> testsData = getOrCreateTestsMap(profileData);
        Map<String, Object> testEntry = new HashMap<>();
        testEntry.put("score", normalizedScore);
        testEntry.put("rawScore", rawScore);
        testEntry.put("maxScore", maxScore);
        testEntry.put("submissionId", savedSubmission.getId().toString());
        testEntry.put("submittedAt", savedSubmission.getSubmittedAt().toString());
        testsData.put(definition.getId().toString(), testEntry);
        profileData.put("tests", testsData);
        profile.setProfile(profileData);
        userPsyProfileRepository.save(profile);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        return userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }

    private Map<UUID, List<TestAnswerOption>> loadOptionsByQuestion(List<TestQuestion> questions) {
        if (questions.isEmpty()) {
            return Map.of();
        }
        List<UUID> questionIds = questions.stream().map(TestQuestion::getId).toList();
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = testAnswerOptionRepository
            .findByQuestionIdIn(questionIds)
            .stream()
            .collect(Collectors.groupingBy(option -> option.getQuestion().getId()));
        optionsByQuestion.values()
            .forEach(options -> options.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt())));
        return optionsByQuestion;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getOrCreateTestsMap(Map<String, Object> profileData) {
        Object existing = profileData.get("tests");
        if (existing instanceof Map<?, ?> existingMap) {
            return (Map<String, Object>) existingMap;
        }
        return new HashMap<>();
    }
}
