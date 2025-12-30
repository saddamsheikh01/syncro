package com.syncro.backend.domain.tags.repository;

import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.entity.UserInterestId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserInterestRepository extends JpaRepository<UserInterest, UserInterestId> {

    List<UserInterest> findAllByUserId(UUID userId);

    void deleteAllByUserId(UUID userId);
}
