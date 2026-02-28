package com.syncro.backend.domain.external.viator;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViatorDestinationRefRepository extends JpaRepository<ViatorDestinationRef, UUID> {

    List<ViatorDestinationRef> findAllByOrderBySortOrderAscDestinationRefAsc();

    List<ViatorDestinationRef> findByEnabledTrueOrderBySortOrderAscDestinationRefAsc();

    Optional<ViatorDestinationRef> findByDestinationRefIgnoreCase(String destinationRef);

    int countByEnabledTrue();
}
