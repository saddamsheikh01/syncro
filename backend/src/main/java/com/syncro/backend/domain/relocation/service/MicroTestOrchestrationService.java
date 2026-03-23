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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class MicroTestOrchestrationService {

    private final MicroTestAssignmentRepository assignmentRepository;
    private final TestDefinitionRepository testDefinitionRepository;
    private final UserTestSubmissionRepository submissionRepository;
    private final RelocationMapper mapper;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public MicroTestOrchestrationService(MicroTestAssignmentRepository assignmentRepository,
                                          TestDefinitionRepository testDefinitionRepository,
                                          UserTestSubmissionRepository submissionRepository,
                                          RelocationMapper mapper,
                                          AnalyticsService analyticsService,
                                          UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.testDefinitionRepository = testDefinitionRepository;
        this.submissionRepository = submissionRepository;
        this.mapper = mapper;
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @Transactional
    public MicroTestNextResponse getNextMicroTest(UUID userId) {
        User user = userRepository.getReferenceById(userId);
        // Check for existing pending/active assignments
        Optional<MicroTestAssignment> existing = assignmentRepository
                .findFirstByUser_IdAndStatusOrderByAvailableFromAsc(userId, "PENDING");

        if (existing.isPresent()) {
            MicroTestAssignment assignment = existing.get();
            if (assignment.getExpiresAt().isBefore(Instant.now())) {
                assignment.setStatus("EXPIRED");
                assignmentRepository.save(assignment);
            } else {
                return mapper.toMicroTestNextResponse(assignment);
            }
        }

        // Find next available test not in anti-repeat window
        List<TestDefinition> allTests = testDefinitionRepository.findByActiveTrueOrderByCreatedAtDesc();
        Instant now = Instant.now();
        for (TestDefinition test : allTests) {
            // Check anti-repeat window
            List<MicroTestAssignment> recentCompletions = assignmentRepository
                    .findRecentCompletedByUserAndTest(userId, test.getId(), now.minus(30, ChronoUnit.DAYS));

            if (!recentCompletions.isEmpty()) {
                continue;
            }

            // Create new assignment
            MicroTestAssignment assignment = new MicroTestAssignment();
            assignment.setUser(user);
            assignment.setTestDefinition(test);
            assignment.setStatus("PENDING");
            assignment.setAvailableFrom(now);
            assignment.setExpiresAt(now.plus(7, ChronoUnit.DAYS));

            assignment = assignmentRepository.save(assignment);
            analyticsService.trackServerEventSafe(userId, "MICRO_TEST_ASSIGNED",
                    Map.of("testId", test.getId().toString(), "assignmentId", assignment.getId().toString()));
            return mapper.toMicroTestNextResponse(assignment);
        }

        throw new NotFoundException("Nessun micro-test disponibile al momento");
    }

    @Transactional
    public void completeAssignment(UUID assignmentId, UUID submissionId) {
        MicroTestAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment non trovato"));

        assignment.setStatus("COMPLETED");
        assignment.setCompletedAt(Instant.now());
        if (submissionId != null) {
            submissionRepository.findById(submissionId).ifPresent(assignment::setSubmission);
        }
        assignmentRepository.save(assignment);
        analyticsService.trackServerEventSafe(assignment.getUser().getId(), "MICRO_TEST_COMPLETED",
                Map.of("assignmentId", assignmentId.toString()));
    }
}
