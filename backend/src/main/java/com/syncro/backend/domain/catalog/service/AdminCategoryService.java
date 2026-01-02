package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.catalog.dto.AdminCategoryRequest;
import com.syncro.backend.domain.catalog.dto.AdminCategoryUpdateRequest;
import com.syncro.backend.domain.catalog.dto.CategoryResponse;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.mapper.CategoryMapper;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public AdminCategoryService(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getCategories(AdminPrincipal principal, int page, int size) {
        ensureAdmin(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        return categoryRepository.findAll(pageable).map(categoryMapper::toResponse);
    }

    @Transactional
    public CategoryResponse createCategory(AdminPrincipal principal, AdminCategoryRequest request) {
        ensureAdmin(principal);
        String name = normalizeRequired(request.name());
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Categoria gia esistente");
        }
        Category category = new Category();
        category.setName(name);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(
        AdminPrincipal principal,
        UUID categoryId,
        AdminCategoryUpdateRequest request
    ) {
        ensureAdmin(principal);
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria non trovata"));

        if (request.name() != null) {
            String name = normalizeRequired(request.name());
            if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, category.getId())) {
                throw new ConflictException("Categoria gia esistente");
            }
            category.setName(name);
        }

        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public void deleteCategory(AdminPrincipal principal, UUID categoryId) {
        ensureAdmin(principal);
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria non trovata"));
        categoryRepository.delete(category);
    }

    private void ensureAdmin(AdminPrincipal principal) {
        if (principal == null || principal.role() == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        AdminRole role = AdminRole.valueOf(principal.role());
        if (role != AdminRole.ADMIN && role != AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException("Permesso negato");
        }
    }

    private String normalizeRequired(String value) {
        if (value == null) {
            throw new BadRequestException("Valore non valido");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Valore non valido");
        }
        return normalized;
    }
}
