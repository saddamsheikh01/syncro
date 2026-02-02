package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.PostComment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    Page<PostComment> findByPostIdOrderByCreatedAtDesc(UUID postId, Pageable pageable);

    long countByPostId(UUID postId);

    @Query("""
        SELECT c.postId AS postId, COUNT(c) AS commentCount
        FROM PostComment c
        WHERE c.postId IN :postIds
        GROUP BY c.postId
        """)
    List<PostCommentCountProjection> countByPostIds(@Param("postIds") List<UUID> postIds);

    void deleteByIdAndUserId(UUID id, UUID userId);

    boolean existsByIdAndUserId(UUID id, UUID userId);
}
