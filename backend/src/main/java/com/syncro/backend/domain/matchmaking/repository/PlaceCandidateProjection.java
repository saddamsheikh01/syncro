package com.syncro.backend.domain.matchmaking.repository;

import java.util.UUID;

public interface PlaceCandidateProjection {

    UUID getPlaceId();

    int getSharedCount();
}
