package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.CatalogResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Catalog", description = "Unified places and experiences (All tab)")
@SecurityRequirement(name = "bearer-jwt")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    @Operation(summary = "Unified catalog: places and experiences in one response")
    public ResponseEntity<CatalogResponse> getCatalog(
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(required = false) List<UUID> tagIds,
        @RequestParam(required = false) List<String> googleTypes,
        @RequestParam(required = false) Boolean openNow,
        @RequestParam(required = false) Double minRating,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(required = false) Double radiusKm,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) CatalogSource source,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(catalogService.getCatalog(
            categoryId,
            tagIds,
            googleTypes,
            openNow,
            minRating,
            lat,
            lng,
            radiusKm,
            q,
            source,
            page,
            size
        ));
    }
}
