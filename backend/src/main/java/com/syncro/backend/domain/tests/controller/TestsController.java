package com.syncro.backend.domain.tests.controller;

import com.syncro.backend.domain.tests.dto.TestCountResponse;
import com.syncro.backend.domain.tests.dto.TestDetailResponse;
import com.syncro.backend.domain.tests.dto.TestListResponse;
import com.syncro.backend.domain.tests.dto.TestSubmissionRequest;
import com.syncro.backend.domain.tests.dto.TestSubmissionResponse;
import com.syncro.backend.domain.tests.service.TestService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tests")
@Tag(name = "Tests", description = "Micro-test per la profilazione Zyra")
@SecurityRequirement(name = "bearer-jwt")
public class TestsController {

    private final TestService testService;

    public TestsController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping
    @Operation(summary = "Lista test attivi")
    public ResponseEntity<TestListResponse> getTests(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(testService.getTests(principal));
    }

    @GetMapping("/{testId}")
    @Operation(summary = "Dettaglio test")
    public ResponseEntity<TestDetailResponse> getTest(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID testId
    ) {
        return ResponseEntity.ok(testService.getTest(principal, testId));
    }

    @GetMapping("/count")
    @Operation(summary = "Conteggio test unici completati (utente autenticato)")
    public ResponseEntity<TestCountResponse> getMyCompletedTestsCount(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(testService.getMyCompletedTestsCount(principal));
    }

    @GetMapping("/users/{userId}/count")
    @Operation(summary = "Conteggio test unici completati (utente target)")
    public ResponseEntity<TestCountResponse> getUserCompletedTestsCount(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(testService.getUserCompletedTestsCount(principal, userId));
    }

    @PostMapping("/{testId}/submit")
    @Operation(summary = "Invia risposte al test")
    public ResponseEntity<TestSubmissionResponse> submitTest(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID testId,
        @Valid @RequestBody TestSubmissionRequest request
    ) {
        TestSubmissionResponse response = testService.submitTest(principal, testId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/submissions/reset")
    @Operation(summary = "Reset delle submission (solo per debug)")
    public ResponseEntity<Void> resetMySubmissions(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        testService.resetMySubmissions(principal);
        return ResponseEntity.noContent().build();
    }
}
