package com.syncro.backend.domain.matchmaking.repository;

import java.util.UUID;

public interface ExperienceCandidateProjection {

    UUID getExperienceId();

    int getSharedCount();
}
