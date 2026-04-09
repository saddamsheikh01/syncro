package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.MicroTestNextResponse;
import com.syncro.backend.domain.relocation.dto.MicroTestSubmitRequest;
import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import com.syncro.backend.domain.relocation.repository.MicroTestAssignmentRepository;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.StreamSupport;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MicroTestOrchestrationServiceTest {

    @Mock private MicroTestAssignmentRepository assignmentRepository;
    @Mock private TestDefinitionRepository testDefinitionRepository;
    @Mock private TestQuestionRepository testQuestionRepository;
    @Mock private TestAnswerOptionRepository testAnswerOptionRepository;
    @Mock private UserTestSubmissionRepository submissionRepository;
    @Mock private UserTestAnswerRepository userTestAnswerRepository;
    @Mock private AnalyticsService analyticsService;
    @Mock private UserRepository userRepository;
    @Mock private TestService testService;
    @InjectMocks private MicroTestOrchestrationService service;

    @Test
    void getNextMicroTest_existingPending_returnsBlockOf3() {
        UUID userId = UUID.randomUUID();

        MicroTestAssignment assignment = new MicroTestAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setStatus("PENDING");
        assignment.setAvailableFrom(Instant.now());
        assignment.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));
        assignment.setBlockStartPosition(0);
        assignment.setBlockSize(3);
        TestDefinition testDef = mockTestDefinition();
        assignment.setTestDefinition(testDef);

        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING"))
                .thenReturn(Optional.of(assignment));
        List<TestQuestion> questions6 = mockQuestions(testDef, 6);
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId()))
                .thenReturn(questions6);
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(List.of());

        MicroTestNextResponse result = service.getNextMicroTest(userId);

        assertNotNull(result);
        assertEquals(3, result.questions().size());
        assertEquals(1, result.blockNumber());
        assertEquals(2, result.totalBlocks());
    }

    @Test
    void getNextMicroTest_noTests_throwsNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.getReferenceById(userId)).thenReturn(mock(User.class));
        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING"))
                .thenReturn(Optional.empty());
        when(testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of());

        assertThrows(NotFoundException.class, () -> service.getNextMicroTest(userId));
    }

    @Test
    void getNextMicroTest_secondBlock_afterFirstCompleted() {
        UUID userId = UUID.randomUUID();
        when(userRepository.getReferenceById(userId)).thenReturn(mock(User.class));
        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING"))
                .thenReturn(Optional.empty());

        TestDefinition testDef = mockTestDefinition();
        when(testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(testDef));
        List<TestQuestion> questions9 = mockQuestions(testDef, 9);
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId()))
                .thenReturn(questions9);

        // 3 questions already answered
        UserTestSubmission sub = mock(UserTestSubmission.class);
        when(sub.getId()).thenReturn(UUID.randomUUID());
        when(submissionRepository.findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId()))
                .thenReturn(Optional.of(sub));
        TestAnswerOption option1 = optionForQuestion(questions9.get(0), 10);
        TestAnswerOption option2 = optionForQuestion(questions9.get(1), 11);
        TestAnswerOption option3 = optionForQuestion(questions9.get(2), 12);
        when(userTestAnswerRepository.findBySubmission_Id(sub.getId()))
                .thenReturn(List.of(
                        savedAnswer(sub, questions9.get(0), option1),
                        savedAnswer(sub, questions9.get(1), option2),
                        savedAnswer(sub, questions9.get(2), option3)
                ));

        when(assignmentRepository.save(any())).thenAnswer(inv -> {
            MicroTestAssignment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(List.of());

        MicroTestNextResponse result = service.getNextMicroTest(userId);

        assertNotNull(result);
        assertEquals(2, result.blockNumber());
        assertEquals(3, result.totalBlocks());
        assertEquals(33, result.completionPercent());
    }

    @Test
    void getNextMicroTest_expiredPending_marksExpiredAndCreatesNew() {
        UUID userId = UUID.randomUUID();
        when(userRepository.getReferenceById(userId)).thenReturn(mock(User.class));

        MicroTestAssignment expired = new MicroTestAssignment();
        expired.setStatus("PENDING");
        expired.setExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));
        TestDefinition testDef = mockTestDefinition();
        expired.setTestDefinition(testDef);

        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING"))
                .thenReturn(Optional.of(expired));
        when(testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(testDef));
        List<TestQuestion> questions6 = mockQuestions(testDef, 6);
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId()))
                .thenReturn(questions6);
        when(submissionRepository.findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId()))
                .thenReturn(Optional.empty());
        when(assignmentRepository.save(any())).thenAnswer(inv -> {
            MicroTestAssignment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(List.of());

        MicroTestNextResponse result = service.getNextMicroTest(userId);
        assertNotNull(result);
        assertEquals("EXPIRED", expired.getStatus());
        verify(assignmentRepository, times(2)).save(any());
    }

    @Test
    void submitBlock_intermediateBlock_persistsMergedAnswersWithoutScoring() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(userRepository.getReferenceById(userId)).thenReturn(user);

        TestDefinition testDef = mockTestDefinition();
        List<TestQuestion> questions = mockQuestions(testDef, 9);
        MicroTestAssignment assignment = new MicroTestAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setStatus("PENDING");
        assignment.setBlockStartPosition(3);
        assignment.setBlockSize(3);
        assignment.setTestDefinition(testDef);

        UserTestSubmission submission = new UserTestSubmission();
        submission.setId(UUID.randomUUID());
        submission.setUser(user);
        submission.setTestDefinition(testDef);

        when(assignmentRepository.findById(assignment.getId())).thenReturn(Optional.of(assignment));
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId())).thenReturn(questions);
        when(submissionRepository.findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId()))
                .thenReturn(Optional.of(submission));
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        TestAnswerOption existingOption1 = optionForQuestion(questions.get(0), 10);
        TestAnswerOption existingOption2 = optionForQuestion(questions.get(1), 11);
        TestAnswerOption existingOption3 = optionForQuestion(questions.get(2), 12);
        when(userTestAnswerRepository.findBySubmission_Id(submission.getId()))
                .thenReturn(List.of(
                        savedAnswer(submission, questions.get(0), existingOption1),
                        savedAnswer(submission, questions.get(1), existingOption2),
                        savedAnswer(submission, questions.get(2), existingOption3)
                ));

        List<TestAnswerOption> newBlockOptions = List.of(
                optionForQuestion(questions.get(3), 20),
                optionForQuestion(questions.get(4), 21),
                optionForQuestion(questions.get(5), 22)
        );
        for (TestAnswerOption option : newBlockOptions) {
            when(testAnswerOptionRepository.findByIdAndQuestion_Id(option.getId(), option.getQuestion().getId()))
                    .thenReturn(Optional.of(option));
        }
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(List.of(
                existingOption1,
                existingOption2,
                existingOption3,
                newBlockOptions.get(0),
                newBlockOptions.get(1),
                newBlockOptions.get(2)
        ));

        MicroTestSubmitRequest request = new MicroTestSubmitRequest(List.of(
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(3).getId(), newBlockOptions.get(0).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(4).getId(), newBlockOptions.get(1).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(5).getId(), newBlockOptions.get(2).getId())
        ));

        service.submitBlock(userId, assignment.getId(), request);

        verify(userTestAnswerRepository).deleteBySubmissionId(submission.getId());
        verify(userTestAnswerRepository).saveAll(argThat(answers ->
                StreamSupport.stream(answers.spliterator(), false).count() == 6));
        verify(testService, never()).submitTest(any(), any(), any());
        verify(assignmentRepository).save(argThat(saved ->
                "COMPLETED".equals(saved.getStatus()) && saved.getSubmission() == submission));
    }

    @Test
    void submitBlock_finalBlock_delegatesToTestServiceWithCumulativeAnswers() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(userRepository.getReferenceById(userId)).thenReturn(user);

        TestDefinition testDef = mockTestDefinition();
        UUID testId = testDef.getId();
        List<TestQuestion> questions = mockQuestions(testDef, 6);
        MicroTestAssignment assignment = new MicroTestAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setStatus("PENDING");
        assignment.setBlockStartPosition(3);
        assignment.setBlockSize(3);
        assignment.setTestDefinition(testDef);

        UserTestSubmission submission = new UserTestSubmission();
        submission.setId(UUID.randomUUID());
        submission.setUser(user);
        submission.setTestDefinition(testDef);

        when(assignmentRepository.findById(assignment.getId())).thenReturn(Optional.of(assignment));
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId())).thenReturn(questions);
        when(submissionRepository.findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId()))
                .thenReturn(Optional.of(submission));
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(submissionRepository.getReferenceById(submission.getId())).thenReturn(submission);
        TestAnswerOption existingOption1 = optionForQuestion(questions.get(0), 10);
        TestAnswerOption existingOption2 = optionForQuestion(questions.get(1), 11);
        TestAnswerOption existingOption3 = optionForQuestion(questions.get(2), 12);
        when(userTestAnswerRepository.findBySubmission_Id(submission.getId()))
                .thenReturn(List.of(
                        savedAnswer(submission, questions.get(0), existingOption1),
                        savedAnswer(submission, questions.get(1), existingOption2),
                        savedAnswer(submission, questions.get(2), existingOption3)
                ));

        List<TestAnswerOption> finalBlockOptions = List.of(
                optionForQuestion(questions.get(3), 20),
                optionForQuestion(questions.get(4), 21),
                optionForQuestion(questions.get(5), 22)
        );
        for (TestAnswerOption option : finalBlockOptions) {
            when(testAnswerOptionRepository.findByIdAndQuestion_Id(option.getId(), option.getQuestion().getId()))
                    .thenReturn(Optional.of(option));
        }
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(List.of(
                existingOption1,
                existingOption2,
                existingOption3,
                finalBlockOptions.get(0),
                finalBlockOptions.get(1),
                finalBlockOptions.get(2)
        ));
        when(testService.submitTest(any(), eq(testId), any()))
                .thenReturn(new TestSubmissionResponse(submission.getId(), testId, Instant.now()));

        MicroTestSubmitRequest request = new MicroTestSubmitRequest(List.of(
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(3).getId(), finalBlockOptions.get(0).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(4).getId(), finalBlockOptions.get(1).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(5).getId(), finalBlockOptions.get(2).getId())
        ));

        service.submitBlock(userId, assignment.getId(), request);

        ArgumentCaptor<com.syncro.backend.domain.tests.dto.TestSubmissionRequest> requestCaptor =
                ArgumentCaptor.forClass(com.syncro.backend.domain.tests.dto.TestSubmissionRequest.class);
        verify(testService).submitTest(any(), eq(testId), requestCaptor.capture());
        assertEquals(6, requestCaptor.getValue().answers().size());
        verify(assignmentRepository).save(argThat(saved ->
                "COMPLETED".equals(saved.getStatus()) && saved.getSubmission() == submission));
    }

    @Test
    void submitBlock_firstBlock_resetsOldSubmissionAnswers() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(userRepository.getReferenceById(userId)).thenReturn(user);

        TestDefinition testDef = mockTestDefinition();
        List<TestQuestion> questions = mockQuestions(testDef, 9);
        MicroTestAssignment assignment = new MicroTestAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setStatus("PENDING");
        assignment.setBlockStartPosition(0);
        assignment.setBlockSize(3);
        assignment.setTestDefinition(testDef);

        UserTestSubmission submission = new UserTestSubmission();
        submission.setId(UUID.randomUUID());
        submission.setUser(user);
        submission.setTestDefinition(testDef);

        when(assignmentRepository.findById(assignment.getId())).thenReturn(Optional.of(assignment));
        when(testQuestionRepository.findByTestDefinitionIdOrderByPositionAsc(testDef.getId())).thenReturn(questions);
        when(submissionRepository.findFirstByUser_IdAndTestDefinition_IdOrderBySubmittedAtDesc(userId, testDef.getId()))
                .thenReturn(Optional.of(submission));
        when(submissionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<TestAnswerOption> firstBlockOptions = List.of(
                optionForQuestion(questions.get(0), 30),
                optionForQuestion(questions.get(1), 31),
                optionForQuestion(questions.get(2), 32)
        );
        for (TestAnswerOption option : firstBlockOptions) {
            when(testAnswerOptionRepository.findByIdAndQuestion_Id(option.getId(), option.getQuestion().getId()))
                    .thenReturn(Optional.of(option));
        }
        when(testAnswerOptionRepository.findByQuestion_IdIn(any())).thenReturn(firstBlockOptions);

        MicroTestSubmitRequest request = new MicroTestSubmitRequest(List.of(
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(0).getId(), firstBlockOptions.get(0).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(1).getId(), firstBlockOptions.get(1).getId()),
                new MicroTestSubmitRequest.MicroTestAnswerRequest(questions.get(2).getId(), firstBlockOptions.get(2).getId())
        ));

        service.submitBlock(userId, assignment.getId(), request);

        verify(userTestAnswerRepository, never()).findBySubmission_Id(submission.getId());
        verify(userTestAnswerRepository).deleteBySubmissionId(submission.getId());
        verify(userTestAnswerRepository).saveAll(argThat(answers ->
                StreamSupport.stream(answers.spliterator(), false).count() == 3));
    }

    // ========== HELPERS ==========

    private TestDefinition mockTestDefinition() {
        TestDefinition td = mock(TestDefinition.class);
        when(td.getId()).thenReturn(UUID.randomUUID());
        lenient().when(td.getTitle()).thenReturn("Test Resilience");
        lenient().when(td.getDescription()).thenReturn("Evaluate your adaptability");
        return td;
    }

    private List<TestQuestion> mockQuestions(TestDefinition testDef, int count) {
        List<TestQuestion> questions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            TestQuestion q = mock(TestQuestion.class);
            lenient().when(q.getTestDefinition()).thenReturn(testDef);
            lenient().when(q.getId()).thenReturn(UUID.randomUUID());
            lenient().when(q.getQuestion()).thenReturn("Question " + (i + 1));
            lenient().when(q.getQuestionType()).thenReturn(TestQuestionType.SINGLE);
            lenient().when(q.getPosition()).thenReturn(i);
            lenient().when(q.isRequired()).thenReturn(true);
            lenient().when(q.getMaxSelections()).thenReturn(1);
            questions.add(q);
        }
        return questions;
    }

    private TestAnswerOption optionForQuestion(TestQuestion question, int weight) {
        TestAnswerOption option = mock(TestAnswerOption.class);
        lenient().when(option.getId()).thenReturn(UUID.randomUUID());
        lenient().when(option.getQuestion()).thenReturn(question);
        lenient().when(option.getWeight()).thenReturn(weight);
        return option;
    }

    private UserTestAnswer savedAnswer(UserTestSubmission submission, TestQuestion question, TestAnswerOption option) {
        UserTestAnswer answer = new UserTestAnswer();
        answer.setSubmission(submission);
        answer.setQuestion(question);
        answer.setAnswerOption(option);
        return answer;
    }
}
