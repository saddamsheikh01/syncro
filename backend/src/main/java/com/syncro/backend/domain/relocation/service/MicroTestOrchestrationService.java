package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import com.syncro.backend.domain.relocation.repository.MicroTestAssignmentRepository;
import com.syncro.backend.domain.tests.dto.TestAnswerRequest;
import com.syncro.backend.domain.tests.dto.TestSubmissionRequest;
import com.syncro.backend.domain.tests.dto.TestSubmissionResponse;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.TestQuestionType;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.domain.tests.service.TestService;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import com.syncro.backend.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MicroTestOrchestrationService {

    private static final int BLOCK_SIZE = 3;

    private final MicroTestAssignmentRepository assignmentRepository;
    private final TestDefinitionRepository testDefinitionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerOptionRepository testAnswerOptionRepository;
    private final UserTestSubmissionRepository submissionRepository;
    private final UserTestAnswerRepository userTestAnswerRepository;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;
    private final TestService testService;

    public MicroTestOrchestrationService(MicroTestAssignmentRepository assignmentRepository,
                                          TestDefinitionRepository testDefinitionRepository,
                                          TestQuestionRepository testQuestionRepository,
                                          TestAnswerOptionRepository testAnswerOptionRepository,
                                          UserTestSubmissionRepository submissionRepository,
                                          UserTestAnswerRepository userTestAnswerRepository,
                                          AnalyticsService analyticsService,
                                          UserRepository userRepository,
                                          TestService testService) {
        this.assignmentRepository = assignmentRepository;
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.submissionRepository = submissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
        this.testService = testService;
    }

    @Transactional
    public MicroTestNextResponse getNextMicroTest(UUID userId) {
        User user = userRepository.getReferenceById(userId);

        // Check for existing pending assignment (block in progress)
        Optional<MicroTestAssignment> existing = assignmentRepository
                .findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING");

        if (existing.isPresent()) {
            MicroTestAssignment assignment = existing.get();
            if (assignment.getExpiresAt().isBefore(Instant.now())) {
                assignment.setStatus("EXPIRED");
                assignmentRepository.save(assignment);
            } else {
                return buildResponse(assignment);
            }
        }

        // Find next incomplete test and next block
        List<TestDefinition> allTests = testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc();
        Instant now = Instant.now();

        for (TestDefinition test : allTests) {
            List<TestQuestion> allQuestions = testQuestionRepository
                    .findByTestDefinitionIdOrderByPositionAsc(test.getId());
            if (allQuestions.isEmpty()) continue;

            int totalQuestions = allQuestions.size();

            // Find how many questions the user has already answered for this test
            int answeredCount = countAnsweredQuestions(userId, test.getId());

            if (answeredCount >= totalQuestions) {
                // Test fully completed — check anti-repeat window
                List<MicroTestAssignment> recentCompletions = assignmentRepository
                        .findRecentCompletedByUserAndTest(userId, test.getId(), now.minus(30, ChronoUnit.DAYS));
                if (!recentCompletions.isEmpty()) continue;
                // If past anti-repeat window, allow re-start from position 0
                answeredCount = 0;
            }

            // Create assignment for next block
            int blockStart = answeredCount;
            MicroTestAssignment assignment = new MicroTestAssignment();
            assignment.setUser(user);
            assignment.setTestDefinition(test);
            assignment.setStatus("PENDING");
            assignment.setAvailableFrom(now);
            assignment.setExpiresAt(now.plus(7, ChronoUnit.DAYS));
            assignment.setBlockStartPosition(blockStart);
            assignment.setBlockSize(BLOCK_SIZE);

            assignment = assignmentRepository.save(assignment);
            analyticsService.trackServerEventSafe(userId, "MICRO_TEST_ASSIGNED",
                    Map.of("testId", test.getId().toString(), "assignmentId", assignment.getId().toString(),
                            "blockStart", String.valueOf(blockStart)));
            return buildResponse(assignment);
        }

        throw new NotFoundException("Nessun micro-test disponibile al momento");
    }

    @Transactional
    public void submitBlock(UUID userId, UUID assignmentId, MicroTestSubmitRequest request) {
        MicroTestAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment non trovato"));

        if (!"PENDING".equals(assignment.getStatus())) {
            throw new BadRequestException("Assignment non in stato PENDING");
        }

        User user = userRepository.getReferenceById(userId);
        TestDefinition testDef = assignment.getTestDefinition();
        List<TestQuestion> allQuestions = testQuestionRepository
                .findByTestDefinitionIdOrderByPositionAsc(testDef.getId());
        if (allQuestions.isEmpty()) {
            throw new BadRequestException("Test senza domande");
        }
        Map<UUID, TestQuestion> questionsById = allQuestions.stream()
                .collect(Collectors.toMap(TestQuestion::getId, q -> q, (left, right) -> left, LinkedHashMap::new));
        Map<UUID, TestQuestion> currentBlockQuestions = resolveCurrentBlockQuestions(assignment, allQuestions);
        Map<UUID, List<UUID>> currentBlockAnswers = normalizeBlockAnswers(request, currentBlockQuestions);

        Optional<UserTestSubmission> existingSubmission = submissionRepository
                .findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId());
        if (assignment.getBlockStartPosition() > 0 && existingSubmission.isEmpty()) {
            throw new BadRequestException("Progressione micro-test incoerente");
        }

        Map<UUID, List<UUID>> cumulativeAnswers = new LinkedHashMap<>();
        if (assignment.getBlockStartPosition() > 0) {
            cumulativeAnswers.putAll(loadSubmissionAnswers(existingSubmission.orElseThrow()));
        }
        cumulativeAnswers.putAll(currentBlockAnswers);

        UserTestSubmission submission = persistPartialSubmission(
                user,
                testDef,
                existingSubmission.orElse(null),
                cumulativeAnswers,
                questionsById
        );

        if (cumulativeAnswers.size() >= allQuestions.size()) {
            TestSubmissionResponse finalSubmission = testService.submitTest(
                    new UserPrincipal(userId),
                    testDef.getId(),
                    toTestSubmissionRequest(cumulativeAnswers)
            );
            submission = submissionRepository.getReferenceById(finalSubmission.submissionId());
        }

        // Mark assignment as completed
        assignment.setStatus("COMPLETED");
        assignment.setCompletedAt(Instant.now());
        assignment.setSubmission(submission);
        assignmentRepository.save(assignment);

        analyticsService.trackServerEventSafe(userId, "MICRO_TEST_COMPLETED",
                Map.of("assignmentId", assignmentId.toString(), "testId", testDef.getId().toString()));
    }

    // ========== HELPERS ==========

    private MicroTestNextResponse buildResponse(MicroTestAssignment assignment) {
        TestDefinition test = assignment.getTestDefinition();
        List<TestQuestion> allQuestions = testQuestionRepository
                .findByTestDefinitionIdOrderByPositionAsc(test.getId());

        int totalQuestions = allQuestions.size();
        int blockStart = assignment.getBlockStartPosition();
        int blockEnd = Math.min(blockStart + assignment.getBlockSize(), totalQuestions);

        List<TestQuestion> blockQuestions = allQuestions.subList(blockStart, blockEnd);

        List<UUID> questionIds = blockQuestions.stream().map(TestQuestion::getId).toList();
        List<TestAnswerOption> allOptions = testAnswerOptionRepository
                .findByQuestion_IdIn(questionIds);
        Map<UUID, List<TestAnswerOption>> optionsByQuestion = allOptions.stream()
                .collect(Collectors.groupingBy(o -> o.getQuestion().getId()));

        List<MicroTestQuestionResponse> questionResponses = blockQuestions.stream()
                .map(q -> new MicroTestQuestionResponse(
                        q.getId(),
                        q.getQuestion(),
                        q.getQuestionType().name(),
                        q.getPosition(),
                        optionsByQuestion.getOrDefault(q.getId(), List.of()).stream()
                                .map(o -> new MicroTestAnswerOptionResponse(o.getId(), o.getLabel(), o.getWeight()))
                                .toList()
                ))
                .toList();

        int totalBlocks = (int) Math.ceil((double) totalQuestions / assignment.getBlockSize());
        int currentBlock = (blockStart / assignment.getBlockSize()) + 1;
        int completionPercent = totalQuestions > 0 ? (blockStart * 100) / totalQuestions : 0;

        return new MicroTestNextResponse(
                assignment.getId(),
                test.getId(),
                test.getTitle(),
                test.getDescription(),
                assignment.getStatus(),
                assignment.getAvailableFrom(),
                assignment.getExpiresAt(),
                currentBlock,
                totalBlocks,
                completionPercent,
                questionResponses
        );
    }

    private int countAnsweredQuestions(UUID userId, UUID testId) {
        Optional<UserTestSubmission> submission = submissionRepository
                .findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testId);
        if (submission.isEmpty()) return 0;
        return (int) userTestAnswerRepository.findBySubmission_Id(submission.get().getId()).stream()
                .map(answer -> answer.getQuestion().getId())
                .distinct()
                .count();
    }

    private Map<UUID, TestQuestion> resolveCurrentBlockQuestions(MicroTestAssignment assignment, List<TestQuestion> allQuestions) {
        int totalQuestions = allQuestions.size();
        int blockStart = assignment.getBlockStartPosition();
        if (blockStart < 0 || blockStart >= totalQuestions) {
            throw new BadRequestException("Blocco micro-test non valido");
        }
        int blockEnd = Math.min(blockStart + assignment.getBlockSize(), totalQuestions);
        return allQuestions.subList(blockStart, blockEnd).stream()
                .collect(Collectors.toMap(TestQuestion::getId, q -> q, (left, right) -> left, LinkedHashMap::new));
    }

    private Map<UUID, List<UUID>> normalizeBlockAnswers(
            MicroTestSubmitRequest request,
            Map<UUID, TestQuestion> blockQuestions
    ) {
        if (request.answers() == null || request.answers().isEmpty()) {
            throw new BadRequestException("Risposte mancanti");
        }

        Map<UUID, List<UUID>> answersByQuestion = new LinkedHashMap<>();
        for (MicroTestSubmitRequest.MicroTestAnswerRequest answer : request.answers()) {
            if (answer == null || answer.questionId() == null || answer.answerOptionId() == null) {
                throw new BadRequestException("Risposte non valide");
            }
            TestQuestion question = blockQuestions.get(answer.questionId());
            if (question == null) {
                throw new BadRequestException("Le risposte non appartengono al blocco corrente");
            }
            answersByQuestion.computeIfAbsent(question.getId(), ignored -> new ArrayList<>()).add(answer.answerOptionId());
        }

        for (TestQuestion question : blockQuestions.values()) {
            List<UUID> optionIds = answersByQuestion.getOrDefault(question.getId(), List.of());
            List<UUID> distinctOptionIds = optionIds.stream().distinct().toList();
            if (distinctOptionIds.size() != optionIds.size()) {
                throw new BadRequestException("Risposte duplicate");
            }
            if (question.isRequired() && distinctOptionIds.isEmpty()) {
                throw new BadRequestException("Risposte mancanti");
            }
            if (question.getQuestionType() == TestQuestionType.SINGLE && distinctOptionIds.size() > 1) {
                throw new BadRequestException("Risposte non valide");
            }
            int maxSelections = resolveMaxSelections(question);
            if (distinctOptionIds.size() > maxSelections) {
                throw new BadRequestException("Troppe risposte selezionate");
            }
            for (UUID optionId : distinctOptionIds) {
                testAnswerOptionRepository.findByIdAndQuestion_Id(optionId, question.getId())
                        .orElseThrow(() -> new BadRequestException("Answer option non trovata: " + optionId));
            }
            if (!distinctOptionIds.isEmpty()) {
                answersByQuestion.put(question.getId(), distinctOptionIds);
            }
        }
        return answersByQuestion;
    }

    private int resolveMaxSelections(TestQuestion question) {
        if (question.getQuestionType() == TestQuestionType.SINGLE) {
            return 1;
        }
        Integer maxSelections = question.getMaxSelections();
        if (maxSelections == null || maxSelections < 1) {
            return Integer.MAX_VALUE;
        }
        return maxSelections;
    }

    private Map<UUID, List<UUID>> loadSubmissionAnswers(UserTestSubmission submission) {
        Map<UUID, List<UUID>> answersByQuestion = new LinkedHashMap<>();
        for (UserTestAnswer answer : userTestAnswerRepository.findBySubmission_Id(submission.getId())) {
            answersByQuestion.computeIfAbsent(answer.getQuestion().getId(), ignored -> new ArrayList<>())
                    .add(answer.getAnswerOption().getId());
        }
        answersByQuestion.replaceAll((ignored, optionIds) -> optionIds.stream().distinct().toList());
        return answersByQuestion;
    }

    private UserTestSubmission persistPartialSubmission(
            User user,
            TestDefinition testDef,
            UserTestSubmission existingSubmission,
            Map<UUID, List<UUID>> answersByQuestion,
            Map<UUID, TestQuestion> questionsById
    ) {
        UserTestSubmission submission = existingSubmission;
        if (submission == null) {
            submission = new UserTestSubmission();
            submission.setUser(user);
            submission.setTestDefinition(testDef);
        } else {
            userTestAnswerRepository.deleteBySubmissionId(submission.getId());
        }

        submission.setScorePayload(new HashMap<>());
        submission.setSubmittedAt(Instant.now());
        submission = submissionRepository.save(submission);

        List<TestAnswerOption> options = testAnswerOptionRepository.findByQuestion_IdIn(answersByQuestion.keySet());
        Map<UUID, TestAnswerOption> optionsById = options.stream()
                .collect(Collectors.toMap(TestAnswerOption::getId, option -> option));

        List<UserTestAnswer> entities = new ArrayList<>();
        for (Map.Entry<UUID, List<UUID>> entry : answersByQuestion.entrySet()) {
            TestQuestion question = questionsById.get(entry.getKey());
            for (UUID optionId : entry.getValue()) {
                TestAnswerOption option = optionsById.get(optionId);
                if (option == null) {
                    throw new BadRequestException("Answer option non trovata: " + optionId);
                }
                UserTestAnswer entity = new UserTestAnswer();
                entity.setSubmission(submission);
                entity.setQuestion(question);
                entity.setAnswerOption(option);
                entities.add(entity);
            }
        }
        if (!entities.isEmpty()) {
            userTestAnswerRepository.saveAll(entities);
        }
        return submission;
    }

    private TestSubmissionRequest toTestSubmissionRequest(Map<UUID, List<UUID>> answersByQuestion) {
        List<TestAnswerRequest> answers = answersByQuestion.entrySet().stream()
                .map(entry -> new TestAnswerRequest(entry.getKey(), List.copyOf(entry.getValue())))
                .toList();
        return new TestSubmissionRequest(answers);
    }
}
