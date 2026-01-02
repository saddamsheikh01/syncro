package com.syncro.backend.domain.catalog.repository;

import com.syncro.backend.domain.catalog.entity.ExperienceTag;
import com.syncro.backend.domain.catalog.entity.ExperienceTagId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceTagRepository extends JpaRepository<ExperienceTag, ExperienceTagId> {

    List<ExperienceTag> findAllByExperienceId(UUID experienceId);

    void deleteAllByExperienceId(UUID experienceId);
}
