package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.MicroTestNextResponse;
import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import com.syncro.backend.domain.relocation.repository.MicroTestAssignmentRepository;
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
import com.syncro.backend.domain.analytics.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
        when(userTestAnswerRepository.findBySubmission_Id(sub.getId()))
                .thenReturn(List.of(mock(UserTestAnswer.class), mock(UserTestAnswer.class), mock(UserTestAnswer.class)));

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
            lenient().when(q.getId()).thenReturn(UUID.randomUUID());
            lenient().when(q.getQuestion()).thenReturn("Question " + (i + 1));
            lenient().when(q.getQuestionType()).thenReturn(TestQuestionType.SINGLE);
            lenient().when(q.getPosition()).thenReturn(i);
            questions.add(q);
        }
        return questions;
    }
}
