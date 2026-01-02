package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.PlaceTag;
import com.syncro.backend.domain.catalog.entity.PlaceTagId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceTagRepository extends JpaRepository<PlaceTag, PlaceTagId> {

    List<PlaceTag> findAllByPlaceId(UUID placeId);

    void deleteAllByPlaceId(UUID placeId);
}
