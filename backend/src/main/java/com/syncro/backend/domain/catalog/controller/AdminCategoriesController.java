package com.syncro.backend.domain.catalog.controller;

import com.syncro.backend.domain.catalog.dto.AdminCategoryRequest;
import com.syncro.backend.domain.catalog.dto.AdminCategoryUpdateRequest;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.service.AdminCategoryService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/categories")
@Tag(name = "Admin Categories", description = "Gestione categorie")
@SecurityRequirement(name = "bearer-jwt")
public class AdminCategoriesController {

    private final AdminCategoryService adminCategoryService;

    public AdminCategoriesController(AdminCategoryService adminCategoryService) {
        this.adminCategoryService = adminCategoryService;
    }

    @GetMapping
    @Operation(summary = "Lista categorie")
    public ResponseEntity<Page<CategoryResponse>> getCategories(
        @AuthenticationPrincipal AdminPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminCategoryService.getCategories(principal, page, size));
    }

    @PostMapping
    @Operation(summary = "Crea categoria")
    public ResponseEntity<CategoryResponse> createCategory(
        @AuthenticationPrincipal AdminPrincipal principal,
        @Valid @RequestBody AdminCategoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(adminCategoryService.createCategory(principal, request));
    }

    @PutMapping("/{categoryId}")
    @Operation(summary = "Aggiorna categoria")
    public ResponseEntity<CategoryResponse> updateCategory(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID categoryId,
        @Valid @RequestBody AdminCategoryUpdateRequest request
    ) {
        return ResponseEntity.ok(adminCategoryService.updateCategory(principal, categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    @Operation(summary = "Elimina categoria")
    public ResponseEntity<Void> deleteCategory(
        @AuthenticationPrincipal AdminPrincipal principal,
        @PathVariable UUID categoryId
    ) {
        adminCategoryService.deleteCategory(principal, categoryId);
        return ResponseEntity.noContent().build();
    }
}
