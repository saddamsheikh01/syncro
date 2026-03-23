package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.relocation.dto.MicroTestNextResponse;
import com.syncro.backend.domain.relocation.entity.MicroTestAssignment;
import com.syncro.backend.domain.relocation.mapper.RelocationMapper;
import com.syncro.backend.domain.relocation.repository.MicroTestAssignmentRepository;
import com.syncro.backend.domain.tests.entity.TestDefinition;
import com.syncro.backend.domain.tests.repository.TestDefinitionRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MicroTestOrchestrationServiceTest {

    @Mock private MicroTestAssignmentRepository assignmentRepository;
    @Mock private TestDefinitionRepository testDefinitionRepository;
    @Mock private UserTestSubmissionRepository submissionRepository;
    @Mock private RelocationMapper mapper;
    @Mock private AnalyticsService analyticsService;
    @Mock private UserRepository userRepository;
    @InjectMocks private MicroTestOrchestrationService service;

    @Test
    void getNextMicroTest_existingPending_returnsIt() {
        User user = mockUser();
        MicroTestAssignment assignment = mock(MicroTestAssignment.class);
        when(assignment.getExpiresAt()).thenReturn(Instant.now().plus(1, ChronoUnit.DAYS));
        MicroTestNextResponse resp = mock(MicroTestNextResponse.class);

        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(user.getId(), "PENDING"))
                .thenReturn(Optional.of(assignment));
        when(mapper.toMicroTestNextResponse(assignment)).thenReturn(resp);

        MicroTestNextResponse result = service.getNextMicroTest(user.getId());
        assertNotNull(result);
        verify(testDefinitionRepository, never()).findByActiveTrueOrderByCreatedAtDesc();
    }

    @Test
    void getNextMicroTest_expiredPending_createsNew() {
        User user = mockUser();
        UUID userId = user.getId();

        MicroTestAssignment expired = mock(MicroTestAssignment.class);
        when(expired.getExpiresAt()).thenReturn(Instant.now().minus(1, ChronoUnit.DAYS));
        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING"))
                .thenReturn(Optional.of(expired));

        TestDefinition testDef = mock(TestDefinition.class);
        when(testDef.getId()).thenReturn(UUID.randomUUID());
        when(testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(testDef));
        when(assignmentRepository.findRecentCompletedByUserAndTest(eq(userId), any(), any())).thenReturn(List.of());
        when(assignmentRepository.save(any())).thenAnswer(inv -> {
            MicroTestAssignment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        MicroTestNextResponse resp = mock(MicroTestNextResponse.class);
        when(mapper.toMicroTestNextResponse(any(MicroTestAssignment.class))).thenReturn(resp);

        MicroTestNextResponse result = service.getNextMicroTest(user.getId());
        assertNotNull(result);
        verify(assignmentRepository, times(2)).save(any());
    }

    @Test
    void getNextMicroTest_allInAntiRepeat_throwsNotFound() {
        User user = mockUser();
        when(assignmentRepository.findFirstByUser_IdAndStatusOrderByAvailableFromAsc(user.getId(), "PENDING"))
                .thenReturn(Optional.empty());

        TestDefinition testDef = mock(TestDefinition.class);
        when(testDef.getId()).thenReturn(UUID.randomUUID());
        when(testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc()).thenReturn(List.of(testDef));
        MicroTestAssignment recent = mock(MicroTestAssignment.class);
        when(assignmentRepository.findRecentCompletedByUserAndTest(any(), any(), any()))
                .thenReturn(List.of(recent));

        assertThrows(NotFoundException.class, () -> service.getNextMicroTest(user.getId()));
    }

    @Test
    void completeAssignment_updatesStatus() {
        UUID assignmentId = UUID.randomUUID();
        MicroTestAssignment assignment = new MicroTestAssignment();
        assignment.setStatus("PENDING");
        User user = mockUser();
        assignment.setUser(user);

        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment));

        service.completeAssignment(assignmentId, null);

        assertEquals("COMPLETED", assignment.getStatus());
        assertNotNull(assignment.getCompletedAt());
        verify(assignmentRepository).save(assignment);
        verify(analyticsService).trackServerEventSafe(any(), eq("MICRO_TEST_COMPLETED"), any());
    }

    @Test
    void completeAssignment_notFound_throwsNotFound() {
        UUID assignmentId = UUID.randomUUID();
        when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.completeAssignment(assignmentId, null));
    }

    private User mockUser() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        return user;
    }
}
