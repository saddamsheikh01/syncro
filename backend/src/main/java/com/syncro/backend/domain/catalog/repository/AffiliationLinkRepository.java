package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.AffiliationLink;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AffiliationLinkRepository extends JpaRepository<AffiliationLink, UUID> {

    List<AffiliationLink> findAllByPlace_Id(UUID placeId);

    List<AffiliationLink> findAllByExperience_Id(UUID experienceId);

    Optional<AffiliationLink> findByIdAndPlace_Id(UUID id, UUID placeId);

    Optional<AffiliationLink> findByIdAndExperience_Id(UUID id, UUID experienceId);

    Optional<AffiliationLink> findFirstByExperience_IdAndProviderIgnoreCase(UUID experienceId, String provider);
}
