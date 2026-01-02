package com.syncro.backend.domain.favorites.repository;

import com.syncro.backend.domain.favorites.entity.UserFavorite;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UUID> {

    Page<UserFavorite> findByUserId(UUID userId, Pageable pageable);

    Page<UserFavorite> findByUserIdAndPlaceIdIsNotNull(UUID userId, Pageable pageable);

    Page<UserFavorite> findByUserIdAndExperienceIdIsNotNull(UUID userId, Pageable pageable);

    boolean existsByUserIdAndPlaceId(UUID userId, UUID placeId);

    boolean existsByUserIdAndExperienceId(UUID userId, UUID experienceId);

    Optional<UserFavorite> findByUserIdAndPlaceId(UUID userId, UUID placeId);

    Optional<UserFavorite> findByUserIdAndExperienceId(UUID userId, UUID experienceId);
}
