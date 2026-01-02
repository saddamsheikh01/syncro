package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkRequest;
import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkUpdateRequest;
import com.syncro.backend.domain.catalog.dto.AdminExperienceRequest;
import com.syncro.backend.domain.catalog.dto.AdminExperienceUpdateRequest;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.service.AdminExperienceService;
import com.syncro.backend.domain.catalog.service.AffiliationLinkService;
import com.syncro.backend.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/experiences")
@Tag(name = "Admin Experiences", description = "Gestione esperienze")
@SecurityRequirement(name = "bearer-jwt")
public class AdminExperiencesController {

    private final AdminExperienceService adminExperienceService;
    private final AffiliationLinkService affiliationLinkService;

    public AdminExperiencesController(
        AdminExperienceService adminExperienceService,
        AffiliationLinkService affiliationLinkService
    ) {
        this.adminExperienceService = adminExperienceService;
        this.affiliationLinkService = affiliationLinkService;
    }

    @GetMapping
    @Operation(summary = "Lista esperienze")
    public ResponseEntity<Page<ExperienceSummaryResponse>> getExperiences(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) List<UUID> tagIds,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(required = false) Double radiusKm,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminExperienceService.getExperiences(
            principal,
            categoryId,
            tagIds,
            lat,
            lng,
            radiusKm,
            q,
            page,
            size
        ));
    }

    @GetMapping("/{experienceId}")
    @Operation(summary = "Dettaglio esperienza")
    public ResponseEntity<ExperienceDetailResponse> getExperience(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId
    ) {
        return ResponseEntity.ok(adminExperienceService.getExperience(principal, experienceId));
    }

    @PostMapping
    @Operation(summary = "Crea esperienza")
    public ResponseEntity<ExperienceDetailResponse> createExperience(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminExperienceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminExperienceService.createExperience(principal, request));
    }

    @PutMapping("/{experienceId}")
    @Operation(summary = "Aggiorna esperienza")
    public ResponseEntity<ExperienceDetailResponse> updateExperience(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId,
        @Valid @RequestBody AdminExperienceUpdateRequest request
    ) {
        return ResponseEntity.ok(adminExperienceService.updateExperience(principal, experienceId, request));
    }

    @DeleteMapping("/{experienceId}")
    @Operation(summary = "Elimina esperienza")
    public ResponseEntity<Void> deleteExperience(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId
    ) {
        adminExperienceService.deleteExperience(principal, experienceId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{experienceId}/affiliations")
    @Operation(summary = "Lista affiliazioni esperienza")
    public ResponseEntity<List<AffiliationLinkResponse>> getAffiliations(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId
    ) {
        return ResponseEntity.ok(affiliationLinkService.getLinksForExperience(principal, experienceId));
    }

    @PostMapping("/{experienceId}/affiliations")
    @Operation(summary = "Crea affiliazione esperienza")
    public ResponseEntity<AffiliationLinkResponse> createAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId,
        @Valid @RequestBody AdminAffiliationLinkRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(affiliationLinkService.createForExperience(principal, experienceId, request));
    }

    @PutMapping("/{experienceId}/affiliations/{affiliationId}")
    @Operation(summary = "Aggiorna affiliazione esperienza")
    public ResponseEntity<AffiliationLinkResponse> updateAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId,
        @PathVariable UUID affiliationId,
        @Valid @RequestBody AdminAffiliationLinkUpdateRequest request
    ) {
        return ResponseEntity.ok(
            affiliationLinkService.updateForExperience(principal, experienceId, affiliationId, request)
        );
    }

    @DeleteMapping("/{experienceId}/affiliations/{affiliationId}")
    @Operation(summary = "Elimina affiliazione esperienza")
    public ResponseEntity<Void> deleteAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID experienceId,
        @PathVariable UUID affiliationId
    ) {
        affiliationLinkService.deleteForExperience(principal, experienceId, affiliationId);
        return ResponseEntity.noContent().build();
    }
}
