package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkRequest;
import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkUpdateRequest;
import com.syncro.backend.domain.catalog.dto.AdminPlaceRequest;
import com.syncro.backend.domain.catalog.dto.AdminPlaceUpdateRequest;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.dto.PlaceDetailResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.service.AdminPlaceService;
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
@RequestMapping("/api/v1/admin/places")
@Tag(name = "Admin Places", description = "Gestione luoghi")
@SecurityRequirement(name = "bearer-jwt")
public class AdminPlacesController {

    private final AdminPlaceService adminPlaceService;
    private final AffiliationLinkService affiliationLinkService;

    public AdminPlacesController(
        AdminPlaceService adminPlaceService,
        AffiliationLinkService affiliationLinkService
    ) {
        this.adminPlaceService = adminPlaceService;
        this.affiliationLinkService = affiliationLinkService;
    }

    @GetMapping
    @Operation(summary = "Lista luoghi")
    public ResponseEntity<Page<PlaceSummaryResponse>> getPlaces(
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
        return ResponseEntity.ok(adminPlaceService.getPlaces(
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

    @GetMapping("/{placeId}")
    @Operation(summary = "Dettaglio luogo")
    public ResponseEntity<PlaceDetailResponse> getPlace(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId
    ) {
        return ResponseEntity.ok(adminPlaceService.getPlace(principal, placeId));
    }

    @PostMapping
    @Operation(summary = "Crea luogo")
    public ResponseEntity<PlaceDetailResponse> createPlace(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminPlaceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminPlaceService.createPlace(principal, request));
    }

    @PutMapping("/{placeId}")
    @Operation(summary = "Aggiorna luogo")
    public ResponseEntity<PlaceDetailResponse> updatePlace(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId,
        @Valid @RequestBody AdminPlaceUpdateRequest request
    ) {
        return ResponseEntity.ok(adminPlaceService.updatePlace(principal, placeId, request));
    }

    @DeleteMapping("/{placeId}")
    @Operation(summary = "Elimina luogo")
    public ResponseEntity<Void> deletePlace(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId
    ) {
        adminPlaceService.deletePlace(principal, placeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{placeId}/affiliations")
    @Operation(summary = "Lista affiliazioni luogo")
    public ResponseEntity<List<AffiliationLinkResponse>> getAffiliations(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId
    ) {
        return ResponseEntity.ok(affiliationLinkService.getLinksForPlace(principal, placeId));
    }

    @PostMapping("/{placeId}/affiliations")
    @Operation(summary = "Crea affiliazione luogo")
    public ResponseEntity<AffiliationLinkResponse> createAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId,
        @Valid @RequestBody AdminAffiliationLinkRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(affiliationLinkService.createForPlace(principal, placeId, request));
    }

    @PutMapping("/{placeId}/affiliations/{affiliationId}")
    @Operation(summary = "Aggiorna affiliazione luogo")
    public ResponseEntity<AffiliationLinkResponse> updateAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId,
        @PathVariable UUID affiliationId,
        @Valid @RequestBody AdminAffiliationLinkUpdateRequest request
    ) {
        return ResponseEntity.ok(
            affiliationLinkService.updateForPlace(principal, placeId, affiliationId, request)
        );
    }

    @DeleteMapping("/{placeId}/affiliations/{affiliationId}")
    @Operation(summary = "Elimina affiliazione luogo")
    public ResponseEntity<Void> deleteAffiliation(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID placeId,
        @PathVariable UUID affiliationId
    ) {
        affiliationLinkService.deleteForPlace(principal, placeId, affiliationId);
        return ResponseEntity.noContent().build();
    }
}
