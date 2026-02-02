package com.syncro.backend.domain.media.repository;

import com.syncro.backend.domain.media.entity.MediaObject;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaObjectRepository extends JpaRepository<MediaObject, UUID> {

    Page<MediaObject> findByOwnerTypeAndOwnerId(MediaOwnerType ownerType, UUID ownerId, Pageable pageable);

    Optional<MediaObject> findFirstByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(
        MediaOwnerType ownerType,
        UUID ownerId
    );

    List<MediaObject> findByOwnerTypeAndOwnerIdIn(MediaOwnerType ownerType, Collection<UUID> ownerIds);
}
