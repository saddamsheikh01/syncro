package com.syncro.backend.domain.matchmaking.repository;

import java.util.UUID;

public interface UserMatchCandidateProjection {

    UUID getUserId();

    int getSharedCount();
}
