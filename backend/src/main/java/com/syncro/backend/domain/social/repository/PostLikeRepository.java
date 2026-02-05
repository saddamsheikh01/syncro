package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.PostLike;
import com.syncro.backend.domain.social.entity.PostLikeId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    @Query(
        """
        SELECT pl.postId as postId, COUNT(pl) as likeCount
        FROM PostLike pl
        WHERE pl.postId IN (:postIds)
          AND pl.reaction = 'LIKE'
        GROUP BY pl.postId
        """
    )
    List<PostLikeCountProjection> countByPostIds(@Param("postIds") List<UUID> postIds);

    @Query(
        """
        SELECT pl.postId
        FROM PostLike pl
        WHERE pl.userId = :userId
          AND pl.postId IN (:postIds)
          AND pl.reaction = 'LIKE'
        """
    )
    List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

    @Query(
        """
        SELECT pl.postId as postId, pl.reaction as reaction, COUNT(pl) as reactionCount
        FROM PostLike pl
        WHERE pl.postId IN (:postIds)
        GROUP BY pl.postId, pl.reaction
        """
    )
    List<PostReactionCountProjection> countReactionsByPostIds(@Param("postIds") List<UUID> postIds);

    @Query(
        """
        SELECT pl.postId as postId, pl.reaction as reaction
        FROM PostLike pl
        WHERE pl.userId = :userId
          AND pl.postId IN (:postIds)
        """
    )
    List<PostUserReactionProjection> findUserReactions(
        @Param("userId") UUID userId,
        @Param("postIds") List<UUID> postIds
    );
}
