package com.syncro.backend.domain.tests.controller;

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
import com.syncro.backend.domain.tests.service.AdminTestService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/tests")
@Tag(name = "Admin Tests", description = "Gestione micro-test")
@SecurityRequirement(name = "bearer-jwt")
public class AdminTestsController {

    private final AdminTestService adminTestService;

    public AdminTestsController(AdminTestService adminTestService) {
        this.adminTestService = adminTestService;
    }

    @GetMapping
    @Operation(summary = "Lista test")
    public ResponseEntity<List<AdminTestDefinitionResponse>> getTests(
        @AuthenticationPrincipal AdminPrincipal principal
    ) {
        return ResponseEntity.ok(adminTestService.getTests(principal));
    }

    @GetMapping("/{testId}")
    @Operation(summary = "Dettaglio test")
    public ResponseEntity<AdminTestDetailResponse> getTest(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId
    ) {
        return ResponseEntity.ok(adminTestService.getTest(principal, testId));
    }

    @PostMapping
    @Operation(summary = "Crea test")
    public ResponseEntity<AdminTestDefinitionResponse> createTest(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminTestDefinitionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminTestService.createTest(principal, request));
    }

    @PutMapping("/{testId}")
    @Operation(summary = "Aggiorna test")
    public ResponseEntity<AdminTestDefinitionResponse> updateTest(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @Valid @RequestBody AdminTestDefinitionUpdateRequest request
    ) {
        return ResponseEntity.ok(adminTestService.updateTest(principal, testId, request));
    }

    @DeleteMapping("/{testId}")
    @Operation(summary = "Elimina test")
    public ResponseEntity<Void> deleteTest(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId
    ) {
        adminTestService.deleteTest(principal, testId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{testId}/questions")
    @Operation(summary = "Crea domanda")
    public ResponseEntity<AdminTestQuestionResponse> createQuestion(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @Valid @RequestBody AdminTestQuestionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminTestService.createQuestion(principal, testId, request));
    }

    @PutMapping("/{testId}/questions/{questionId}")
    @Operation(summary = "Aggiorna domanda")
    public ResponseEntity<AdminTestQuestionResponse> updateQuestion(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @PathVariable UUID questionId,
        @Valid @RequestBody AdminTestQuestionUpdateRequest request
    ) {
        return ResponseEntity.ok(adminTestService.updateQuestion(principal, testId, questionId, request));
    }

    @DeleteMapping("/{testId}/questions/{questionId}")
    @Operation(summary = "Elimina domanda")
    public ResponseEntity<Void> deleteQuestion(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @PathVariable UUID questionId
    ) {
        adminTestService.deleteQuestion(principal, testId, questionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{testId}/questions/{questionId}/options")
    @Operation(summary = "Crea opzione")
    public ResponseEntity<AdminTestAnswerOptionResponse> createAnswerOption(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @PathVariable UUID questionId,
        @Valid @RequestBody AdminTestAnswerOptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminTestService.createAnswerOption(principal, testId, questionId, request));
    }

    @PutMapping("/{testId}/questions/{questionId}/options/{optionId}")
    @Operation(summary = "Aggiorna opzione")
    public ResponseEntity<AdminTestAnswerOptionResponse> updateAnswerOption(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @PathVariable UUID questionId,
        @PathVariable UUID optionId,
        @Valid @RequestBody AdminTestAnswerOptionUpdateRequest request
    ) {
        return ResponseEntity.ok(adminTestService.updateAnswerOption(principal, testId, questionId, optionId, request));
    }

    @DeleteMapping("/{testId}/questions/{questionId}/options/{optionId}")
    @Operation(summary = "Elimina opzione")
    public ResponseEntity<Void> deleteAnswerOption(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID testId,
        @PathVariable UUID questionId,
        @PathVariable UUID optionId
    ) {
        adminTestService.deleteAnswerOption(principal, testId, questionId, optionId);
        return ResponseEntity.noContent().build();
    }
}
