package com.syncro.backend.domain.external.viator;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExternalSyncStateRepository extends JpaRepository<ExternalSyncState, UUID> {

    Optional<ExternalSyncState> findByProviderAndScope(String provider, String scope);
}
