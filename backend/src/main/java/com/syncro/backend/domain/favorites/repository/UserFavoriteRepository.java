package com.syncro.backend.domain.favorites.repository;

import com.syncro.backend.domain.favorites.entity.UserFavorite;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, UUID> {

    @Query("select distinct uf.userId from UserFavorite uf where uf.userId in :userIds")
    java.util.List<UUID> findDistinctUserIdsByUserIdIn(@Param("userIds") Collection<UUID> userIds);

    Page<UserFavorite> findByUserId(UUID userId, Pageable pageable);

    Page<UserFavorite> findByUserIdAndPlaceIdIsNotNull(UUID userId, Pageable pageable);

    Page<UserFavorite> findByUserIdAndExperienceIdIsNotNull(UUID userId, Pageable pageable);

    Page<UserFavorite> findByUserIdAndPostIdIsNotNull(UUID userId, Pageable pageable);

    boolean existsByUserIdAndPlaceId(UUID userId, UUID placeId);

    boolean existsByUserIdAndExperienceId(UUID userId, UUID experienceId);

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    Optional<UserFavorite> findByUserIdAndPlaceId(UUID userId, UUID placeId);

    Optional<UserFavorite> findByUserIdAndExperienceId(UUID userId, UUID experienceId);

    Optional<UserFavorite> findByUserIdAndPostId(UUID userId, UUID postId);

    @Query(
        """
        SELECT uf.postId
        FROM UserFavorite uf
        WHERE uf.userId = :userId
          AND uf.postId IN (:postIds)
        """
    )
    java.util.List<UUID> findPostIdsByUserIdAndPostIdIn(
        @Param("userId") UUID userId,
        @Param("postIds") java.util.List<UUID> postIds
    );
}
