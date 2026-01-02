package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.PlaceDetailResponse;
import com.syncro.backend.domain.catalog.dto.PlaceSummaryResponse;
import com.syncro.backend.domain.catalog.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/places")
@Tag(name = "Places", description = "Luoghi")
@SecurityRequirement(name = "bearer-jwt")
public class PlacesController {

    private final PlaceService placeService;

    public PlacesController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping
    @Operation(summary = "Lista luoghi")
    public ResponseEntity<Page<PlaceSummaryResponse>> getPlaces(
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) List<UUID> tagIds,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(required = false) Double radiusKm,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(placeService.getPlaces(
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
    public ResponseEntity<PlaceDetailResponse> getPlace(@PathVariable UUID placeId) {
        return ResponseEntity.ok(placeService.getPlace(placeId));
    }
}
