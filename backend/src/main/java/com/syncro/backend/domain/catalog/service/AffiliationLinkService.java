package com.syncro.backend.domain.catalog.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkRequest;
import com.syncro.backend.domain.catalog.dto.AdminAffiliationLinkUpdateRequest;
import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.entity.AffiliationLink;
import com.syncro.backend.domain.catalog.entity.Experience;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.mapper.AffiliationLinkMapper;
import com.syncro.backend.domain.catalog.repository.AffiliationLinkRepository;
import com.syncro.backend.domain.catalog.repository.ExperienceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.security.AdminPrincipal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AffiliationLinkService {

    private final AffiliationLinkRepository affiliationLinkRepository;
    private final PlaceRepository placeRepository;
    private final ExperienceRepository experienceRepository;
    private final AffiliationLinkMapper affiliationLinkMapper;

    public AffiliationLinkService(
        AffiliationLinkRepository affiliationLinkRepository,
        PlaceRepository placeRepository,
        ExperienceRepository experienceRepository,
        AffiliationLinkMapper affiliationLinkMapper
    ) {
        this.affiliationLinkRepository = affiliationLinkRepository;
        this.placeRepository = placeRepository;
        this.experienceRepository = experienceRepository;
        this.affiliationLinkMapper = affiliationLinkMapper;
    }

    @Transactional(readOnly = true)
    public List<AffiliationLinkResponse> getLinksForPlace(UUID placeId) {
        return affiliationLinkRepository.findAllByPlace_Id(placeId)
            .stream()
            .sorted(Comparator.comparing(AffiliationLink::getCreatedAt))
            .map(affiliationLinkMapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AffiliationLinkResponse> getLinksForPlace(AdminPrincipal principal, UUID placeId) {
        ensureAdmin(principal);
        if (!placeRepository.existsById(placeId)) {
            throw new NotFoundException("Luogo non trovato");
        }
        return getLinksForPlace(placeId);
    }

    @Transactional(readOnly = true)
    public List<AffiliationLinkResponse> getLinksForExperience(UUID experienceId) {
        return affiliationLinkRepository.findAllByExperience_Id(experienceId)
            .stream()
            .sorted(Comparator.comparing(AffiliationLink::getCreatedAt))
            .map(affiliationLinkMapper::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AffiliationLinkResponse> getLinksForExperience(AdminPrincipal principal, UUID experienceId) {
        ensureAdmin(principal);
        if (!experienceRepository.existsById(experienceId)) {
            throw new NotFoundException("Esperienza non trovata");
        }
        return getLinksForExperience(experienceId);
    }

    @Transactional
    public AffiliationLinkResponse createForPlace(
        AdminPrincipal principal,
        UUID placeId,
        AdminAffiliationLinkRequest request
    ) {
        ensureAdmin(principal);
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
        AffiliationLink link = new AffiliationLink();
        link.setPlace(place);
        link.setUrl(normalizeRequired(request.url()));
        link.setProvider(normalizeOptional(request.provider()));
        AffiliationLink saved = affiliationLinkRepository.save(link);
        return affiliationLinkMapper.toResponse(saved);
    }

    @Transactional
    public AffiliationLinkResponse updateForPlace(
        AdminPrincipal principal,
        UUID placeId,
        UUID affiliationId,
        AdminAffiliationLinkUpdateRequest request
    ) {
        ensureAdmin(principal);
        AffiliationLink link = affiliationLinkRepository.findByIdAndPlace_Id(affiliationId, placeId)
            .orElseThrow(() -> new NotFoundException("Affiliazione non trovata"));
        applyUpdate(link, request);
        AffiliationLink saved = affiliationLinkRepository.save(link);
        return affiliationLinkMapper.toResponse(saved);
    }

    @Transactional
    public void deleteForPlace(AdminPrincipal principal, UUID placeId, UUID affiliationId) {
        ensureAdmin(principal);
        AffiliationLink link = affiliationLinkRepository.findByIdAndPlace_Id(affiliationId, placeId)
            .orElseThrow(() -> new NotFoundException("Affiliazione non trovata"));
        affiliationLinkRepository.delete(link);
    }

    @Transactional
    public AffiliationLinkResponse createForExperience(
        AdminPrincipal principal,
        UUID experienceId,
        AdminAffiliationLinkRequest request
    ) {
        ensureAdmin(principal);
        Experience experience = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new NotFoundException("Esperienza non trovata"));
        AffiliationLink link = new AffiliationLink();
        link.setExperience(experience);
        link.setUrl(normalizeRequired(request.url()));
        link.setProvider(normalizeOptional(request.provider()));
        AffiliationLink saved = affiliationLinkRepository.save(link);
        return affiliationLinkMapper.toResponse(saved);
    }

    @Transactional
    public AffiliationLinkResponse updateForExperience(
        AdminPrincipal principal,
        UUID experienceId,
        UUID affiliationId,
        AdminAffiliationLinkUpdateRequest request
    ) {
        ensureAdmin(principal);
        AffiliationLink link = affiliationLinkRepository.findByIdAndExperience_Id(affiliationId, experienceId)
            .orElseThrow(() -> new NotFoundException("Affiliazione non trovata"));
        applyUpdate(link, request);
        AffiliationLink saved = affiliationLinkRepository.save(link);
        return affiliationLinkMapper.toResponse(saved);
    }

    @Transactional
    public void deleteForExperience(AdminPrincipal principal, UUID experienceId, UUID affiliationId) {
        ensureAdmin(principal);
        AffiliationLink link = affiliationLinkRepository.findByIdAndExperience_Id(affiliationId, experienceId)
            .orElseThrow(() -> new NotFoundException("Affiliazione non trovata"));
        affiliationLinkRepository.delete(link);
    }

    private void applyUpdate(AffiliationLink link, AdminAffiliationLinkUpdateRequest request) {
        if (request.url() == null && request.provider() == null) {
            throw new BadRequestException("Nessun dato da aggiornare");
        }
        if (request.url() != null) {
            link.setUrl(normalizeRequired(request.url()));
        }
        if (request.provider() != null) {
            link.setProvider(normalizeOptional(request.provider()));
        }
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
