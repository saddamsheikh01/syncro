package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.*;
import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import com.syncro.backend.domain.relocation.repository.MicroTestAssignmentRepository;
import com.syncro.backend.domain.tests.entity.TestAnswerOption;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.entity.TestQuestion;
import com.syncro.backend.domain.tests.entity.UserTestAnswer;
import com.syncro.backend.domain.tests.entity.UserTestSubmission;
import com.syncro.backend.domain.tests.repository.TestAnswerOptionRepository;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
import com.syncro.backend.domain.tests.repository.TestQuestionRepository;
import com.syncro.backend.domain.tests.repository.UserTestAnswerRepository;
import com.syncro.backend.domain.tests.repository.UserTestSubmissionRepository;
import com.syncro.backend.domain.analytics.service.AnalyticsService;
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

    public MicroTestOrchestrationService(MicroTestAssignmentRepository assignmentRepository,
                                          TestDefinitionRepository testDefinitionRepository,
                                          TestQuestionRepository testQuestionRepository,
                                          TestAnswerOptionRepository testAnswerOptionRepository,
                                          UserTestSubmissionRepository submissionRepository,
                                          UserTestAnswerRepository userTestAnswerRepository,
                                          AnalyticsService analyticsService,
                                          UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.testDefinitionRepository = testDefinitionRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testAnswerOptionRepository = testAnswerOptionRepository;
        this.submissionRepository = submissionRepository;
        this.userTestAnswerRepository = userTestAnswerRepository;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
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

        // Create or get existing submission for this test
        UserTestSubmission submission = submissionRepository
                .findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId())
                .orElseGet(() -> {
                    UserTestSubmission s = new UserTestSubmission();
                    s.setUser(user);
                    s.setTestDefinition(testDef);
                    s.setScorePayload(new HashMap<>());
                    return submissionRepository.save(s);
                });

        // Save answers
        for (MicroTestSubmitRequest.MicroTestAnswerRequest answer : request.answers()) {
            TestAnswerOption option = testAnswerOptionRepository.findById(answer.answerOptionId())
                    .orElseThrow(() -> new BadRequestException("Answer option non trovata: " + answer.answerOptionId()));

            UserTestAnswer testAnswer = new UserTestAnswer();
            testAnswer.setSubmission(submission);
            testAnswer.setQuestion(testQuestionRepository.getReferenceById(answer.questionId()));
            testAnswer.setAnswerOption(option);
            userTestAnswerRepository.save(testAnswer);
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
        return userTestAnswerRepository.findBySubmission_Id(submission.get().getId()).size();
    }
}
