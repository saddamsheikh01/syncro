package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.catalog.dto.AdminExperienceRequest;
import com.syncro.backend.domain.catalog.dto.AdminExperienceUpdateRequest;
import com.syncro.backend.domain.catalog.dto.ExperienceDetailResponse;
import com.syncro.backend.domain.catalog.dto.ExperienceSummaryResponse;
import com.syncro.backend.domain.catalog.entity.CatalogSource;
import com.syncro.backend.domain.catalog.entity.Category;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.ExperienceTag;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.repository.CategoryRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceTagRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminExperienceService {

    private final ExperienceRepository experienceRepository;
    private final CategoryRepository categoryRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceTagRepository experienceTagRepository;
    private final TagRepository tagRepository;
    private final ExperienceService experienceService;

    public AdminExperienceService(
        ExperienceRepository experienceRepository,
        CategoryRepository categoryRepository,
        PlaceRepository placeRepository,
        ExperienceTagRepository experienceTagRepository,
        TagRepository tagRepository,
        ExperienceService experienceService
    ) {
        this.experienceRepository = experienceRepository;
        this.categoryRepository = categoryRepository;
        this.placeRepository = placeRepository;
        this.experienceTagRepository = experienceTagRepository;
        this.tagRepository = tagRepository;
        this.experienceService = experienceService;
    }

    @Transactional(readOnly = true)
    public Page<ExperienceSummaryResponse> getExperiences(
        AdminPrincipal principal,
        UUID categoryId,
        List<UUID> tagIds,
        Double latitude,
        Double longitude,
        Double radiusKm,
        String query,
        int page,
        int size
    ) {
        ensureAdmin(principal);
        return experienceService.getExperiences(
            categoryId,
            tagIds,
            latitude,
            longitude,
            radiusKm,
            query,
            page,
            size
        );
    }

    @Transactional(readOnly = true)
    public ExperienceDetailResponse getExperience(AdminPrincipal principal, UUID experienceId) {
        ensureAdmin(principal);
        return experienceService.getExperience(experienceId);
    }

    @Transactional
    public ExperienceDetailResponse createExperience(AdminPrincipal principal, AdminExperienceRequest request) {
        ensureAdmin(principal);
        Experience experience = new Experience();
        experience.setName(normalizeRequired(request.name()));
        experience.setDescription(normalizeOptional(request.description()));
        experience.setCategory(resolveCategory(request.categoryId()));
        experience.setPlace(resolvePlace(request.placeId()));
        experience.setSource(resolveSource(request.source()));

        Experience saved = experienceRepository.save(experience);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        return experienceService.getExperience(saved.getId());
    }

    @Transactional
    public ExperienceDetailResponse updateExperience(
        AdminPrincipal principal,
        UUID experienceId,
        AdminExperienceUpdateRequest request
    ) {
        ensureAdmin(principal);
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));

        if (request.name() != null) {
            experience.setName(normalizeRequired(request.name()));
        }
        if (request.description() != null) {
            experience.setDescription(normalizeOptional(request.description()));
        }
        if (request.categoryId() != null) {
            experience.setCategory(resolveCategory(request.categoryId()));
        }
        if (request.placeId() != null) {
            experience.setPlace(resolvePlace(request.placeId()));
        }
        if (request.source() != null) {
            experience.setSource(request.source());
        }

        Experience saved = experienceRepository.save(experience);
        if (request.tagIds() != null) {
            replaceTags(saved, request.tagIds());
        }
        return experienceService.getExperience(saved.getId());
    }

    @Transactional
    public void deleteExperience(AdminPrincipal principal, UUID experienceId) {
        ensureAdmin(principal);
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));
        experienceRepository.delete(experience);
    }

    private void replaceTags(Experience experience, List<UUID> tagIds) {
        experienceTagRepository.deleteAllByExperienceId(experience.getId());
        Set<UUID> uniqueIds = new LinkedHashSet<>(tagIds);
        if (uniqueIds.isEmpty()) {
            return;
        }
        List<Tag> tags = resolveTags(uniqueIds);
        List<ExperienceTag> links = tags.stream()
            .map(tag -> buildExperienceTag(experience, tag))
            .toList();
        experienceTagRepository.saveAll(links);
    }

    private ExperienceTag buildExperienceTag(Experience experience, Tag tag) {
        ExperienceTag link = new ExperienceTag();
        link.setExperience(experience);
        link.setTag(tag);
        return link;
    }

    private Category resolveCategory(UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        return categoryRepository.findById(categoryId)
            .orElseThrow(() -> new NotFoundException("Categoria non trovata"));
    }

    private Place resolvePlace(UUID placeId) {
        if (placeId == null) {
            return null;
        }
        return placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
    }

    private List<Tag> resolveTags(Set<UUID> tagIds) {
        List<Tag> tags = tagRepository.findAllById(tagIds);
        if (tags.size() != tagIds.size()) {
            Set<UUID> missing = new LinkedHashSet<>(tagIds);
            Set<UUID> found = tags.stream().map(Tag::getId).collect(Collectors.toSet());
            missing.removeAll(found);
            throw new NotFoundException("Tag non trovati: " + missing);
        }
        return tags;
    }

    private CatalogSource resolveSource(CatalogSource source) {
        return source != null ? source : CatalogSource.MANUAL;
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

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
