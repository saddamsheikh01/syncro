package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.dto.GetExperiencesResult;
import com.syncro.backend.domain.catalog.dto.JobAcceptedResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.service.ExperienceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/experiences")
@Tag(name = "Experiences", description = "Esperienze")
@SecurityRequirement(name = "bearer-jwt")
public class ExperiencesController {

    private final ExperienceService experienceService;

    public ExperiencesController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @GetMapping
    @Operation(summary = "Lista esperienze. Con source=VIATOR e lat/lng o q: può restituire 202 con jobId da ripollare. locale: preferito per cache/job (es. en, it).")
    public ResponseEntity<?> getExperiences(
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) List<UUID> tagIds,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(required = false) Double radiusKm,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) CatalogSource source,
        @RequestParam(required = false) String locale,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        GetExperiencesResult result = experienceService.getExperiences(
            categoryId,
            tagIds,
            lat,
            lng,
            radiusKm,
            q,
            source,
            locale,
            page,
            size
        );
        if (result instanceof GetExperiencesResult.GetExperiencesData data) {
            return ResponseEntity.ok(data.page());
        }
        GetExperiencesResult.GetExperiencesJobAccepted job = (GetExperiencesResult.GetExperiencesJobAccepted) result;
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(job.jobAccepted());
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Stato job di fetch esperienze Viator (per polling dopo 202)")
    public ResponseEntity<JobAcceptedResponse> getJobStatus(@PathVariable UUID jobId) {
        return ResponseEntity.ok(experienceService.getJobStatus(jobId));
    }

    @GetMapping("/{experienceId}")
    @Operation(summary = "Dettaglio esperienza")
    public ResponseEntity<ExperienceDetailResponse> getExperience(@PathVariable String experienceId) {
        return ResponseEntity.ok(experienceService.getExperience(experienceId));
    }
}
