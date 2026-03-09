package com.syncro.backend.domain.external.viator;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefCreateRequest;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefResponse;
import com.syncro.backend.domain.external.viator.dto.ViatorDestinationRefUpdateRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ViatorDestinationRefService {

    private final ViatorDestinationRefRepository repository;

    public ViatorDestinationRefService(ViatorDestinationRefRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ViatorDestinationRefResponse> listAll() {
        return repository.findAllByOrderBySortOrderAscDestinationRefAsc()
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listEnabledDestinationRefs() {
        return repository.findByEnabledTrueOrderBySortOrderAscDestinationRefAsc()
            .stream()
            .map(ViatorDestinationRef::getDestinationRef)
            .map(this::normalizeDestinationRef)
            .filter(value -> value != null)
            .distinct()
            .toList();
    }

    @Transactional(readOnly = true)
    public int countEnabledDestinationRefs() {
        return repository.countByEnabledTrue();
    }

    @Transactional(readOnly = true)
    public String resolveCityNameForRef(String destinationRef) {
        String normalizedRef = normalizeDestinationRef(destinationRef);
        if (normalizedRef == null) {
            return null;
        }
        return repository.findByDestinationRefIgnoreCase(normalizedRef)
            .map(ViatorDestinationRef::getCityName)
            .map(this::normalizeNullable)
            .orElse(null);
    }

    @Transactional
    public ViatorDestinationRefResponse create(ViatorDestinationRefCreateRequest request) {
        String destinationRef = normalizeDestinationRef(request.destinationRef());
        if (destinationRef == null) {
            throw new BadRequestException("destinationRef non valido");
        }
        repository.findByDestinationRefIgnoreCase(destinationRef)
            .ifPresent(existing -> {
                throw new ConflictException("destinationRef gia presente");
            });

        ViatorDestinationRef entity = new ViatorDestinationRef();
        entity.setDestinationRef(destinationRef);
        entity.setCityName(normalizeNullable(request.cityName()));
        entity.setEnabled(Boolean.TRUE.equals(request.enabled()));
        entity.setSortOrder(request.sortOrder() != null ? request.sortOrder() : 100);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public ViatorDestinationRefResponse update(UUID id, ViatorDestinationRefUpdateRequest request) {
        ViatorDestinationRef entity = repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Viator destination ref not found"));

        if (request.cityName() != null) {
            entity.setCityName(normalizeNullable(request.cityName()));
        }
        if (request.enabled() != null) {
            entity.setEnabled(request.enabled());
        }
        if (request.sortOrder() != null) {
            entity.setSortOrder(request.sortOrder());
        }
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Viator destination ref not found");
        }
        repository.deleteById(id);
    }

    private ViatorDestinationRefResponse toResponse(ViatorDestinationRef entity) {
        return new ViatorDestinationRefResponse(
            entity.getId(),
            entity.getDestinationRef(),
            entity.getCityName(),
            entity.isEnabled(),
            entity.getSortOrder(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeDestinationRef(String value) {
        String trimmed = normalizeNullable(value);
        if (trimmed == null) {
            return null;
        }
        return trimmed.toUpperCase();
    }
}
