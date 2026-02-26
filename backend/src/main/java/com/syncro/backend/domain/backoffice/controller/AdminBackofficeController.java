package com.syncro.backend.domain.backoffice.controller;

import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.UserStatus;
import com.syncro.backend.domain.backoffice.dto.AdminCreateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminCreateUserRequest;
import com.syncro.backend.domain.backoffice.dto.AdminSupportMessageResponse;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateAdminRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserMatchmakingRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserPasswordRequest;
import com.syncro.backend.domain.backoffice.dto.AdminUpdateUserRequest;
import com.syncro.backend.domain.profile.dto.UserPreferencesResponse;
import com.syncro.backend.domain.profile.dto.UserProfileResponse;
import com.syncro.backend.domain.backoffice.service.AdminBackofficeService;
import com.syncro.backend.domain.support.entity.SupportCategory;
import com.syncro.backend.domain.tests.dto.TestCountResponse;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/users/{userId}/profile")
    @Operation(summary = "Profilo utente app (campi compilati)")
    public ResponseEntity<UserProfileResponse> getUserProfile(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUserProfile(principal, userId));
    }

    @GetMapping("/users/{userId}/tests/count")
    @Operation(summary = "Conteggio test unici completati dall'utente")
    public ResponseEntity<TestCountResponse> getUserTestsCount(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUserTestsCount(principal, userId));
    }

    @GetMapping("/users/{userId}/preferences")
    @Operation(summary = "Preferenze utente app")
    public ResponseEntity<UserPreferencesResponse> getUserPreferences(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(adminBackofficeService.getUserPreferences(principal, userId));
    }

    @PutMapping("/users/{userId}/preferences/matchmaking")
    @Operation(summary = "Aggiorna filtri matchmaking utente app")
    public ResponseEntity<UserPreferencesResponse> updateUserMatchmakingPreferences(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId,
        @Valid @RequestBody AdminUpdateUserMatchmakingRequest request
    ) {
        return ResponseEntity.ok(
            adminBackofficeService.updateUserMatchmakingPreferences(principal, userId, request)
        );
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

    @PatchMapping("/users/{userId}/password")
    @Operation(summary = "Aggiorna password utente app")
    public ResponseEntity<Void> updateUserPassword(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId,
        @Valid @RequestBody AdminUpdateUserPasswordRequest request
    ) {
        adminBackofficeService.updateUserPassword(principal, userId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/password/reset-link")
    @Operation(summary = "Invia link reset password a utente app")
    public ResponseEntity<Void> sendUserPasswordResetLink(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID userId
    ) {
        adminBackofficeService.sendUserPasswordResetLink(principal, userId);
        return ResponseEntity.noContent().build();
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

    @GetMapping("/support/messages")
    @Operation(summary = "Lista richieste supporto utenti")
    public ResponseEntity<Page<AdminSupportMessageResponse>> getSupportMessages(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) SupportCategory category,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            adminBackofficeService.getSupportMessages(principal, q, category, page, size)
        );
    }
}
