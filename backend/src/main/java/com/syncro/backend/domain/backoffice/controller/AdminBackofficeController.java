package com.syncro.backend.domain.backoffice.controller;

import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.backoffice.dto.AdminCreateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminCreateUserRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserRequest;
import com.syncro.backend.domain.backoffice.service.AdminBackofficeService;
import com.syncro.backend.domain.tests.dto.TestCountResponse;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.UserStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Backoffice", description = "Gestione utenti e admin")
@SecurityRequirement(name = "bearer-jwt")
public class AdminBackofficeController {

    private final AdminBackofficeService adminBackofficeService;

    public AdminBackofficeController(AdminBackofficeService adminBackofficeService) {
        this.adminBackofficeService = adminBackofficeService;
    }

    @GetMapping("/users")
    @Operation(summary = "Lista utenti app")
    public ResponseEntity<Page<UserResponse>> getUsers(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) UserStatus status,
        @RequestParam(required = false) Boolean onboardingCompleted,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUsers(
            principal,
            email,
            status,
            onboardingCompleted,
            page,
            size
        ));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Dettaglio utente app")
    public ResponseEntity<UserResponse> getUser(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUser(principal, userId));
    }

    @GetMapping("/users/{userId}/tests/count")
    @Operation(summary = "Conteggio test unici completati dall'utente")
    public ResponseEntity<TestCountResponse> getUserTestsCount(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUserTestsCount(principal, userId));
    }

    @PostMapping("/users")
    @Operation(summary = "Crea utente app")
    public ResponseEntity<UserResponse> createUser(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminCreateUserRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminBackofficeService.createUser(principal, request));
    }

    @PatchMapping("/users/{userId}")
    @Operation(summary = "Aggiorna utente app")
    public ResponseEntity<UserResponse> updateUser(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId,
        @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ResponseEntity.ok(adminBackofficeService.updateUser(principal, userId, request));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Elimina utente app (soft delete)")
    public ResponseEntity<Void> deleteUser(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        adminBackofficeService.deleteUser(principal, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin-users")
    @Operation(summary = "Lista admin")
    public ResponseEntity<Page<AdminUserResponse>> getAdminUsers(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String email,
        @RequestParam(required = false) AdminStatus status,
        @RequestParam(required = false) AdminRole role,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminBackofficeService.getAdminUsers(
            principal,
            email,
            status,
            role,
            page,
            size
        ));
    }

    @GetMapping("/admin-users/{adminId}")
    @Operation(summary = "Dettaglio admin")
    public ResponseEntity<AdminUserResponse> getAdminUser(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID adminId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getAdminUser(principal, adminId));
    }

    @PostMapping("/admin-users")
    @Operation(summary = "Crea admin")
    public ResponseEntity<AdminUserResponse> createAdmin(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminCreateAdminRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminBackofficeService.createAdmin(principal, request));
    }

    @PatchMapping("/admin-users/{adminId}")
    @Operation(summary = "Aggiorna admin")
    public ResponseEntity<AdminUserResponse> updateAdmin(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID adminId,
        @Valid @RequestBody AdminUpdateAdminRequest request
    ) {
        return ResponseEntity.ok(adminBackofficeService.updateAdmin(principal, adminId, request));
    }

    @DeleteMapping("/admin-users/{adminId}")
    @Operation(summary = "Elimina admin")
    public ResponseEntity<Void> deleteAdmin(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID adminId
    ) {
        adminBackofficeService.deleteAdmin(principal, adminId);
        return ResponseEntity.noContent().build();
    }
}
