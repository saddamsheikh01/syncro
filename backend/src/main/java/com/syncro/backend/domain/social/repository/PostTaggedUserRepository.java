package com.syncro.backend.domain.social.repository;

import com.syncro.backend.domain.social.entity.PostTaggedUser;
import com.syncro.backend.domain.social.entity.PostTaggedUserId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostTaggedUserRepository extends JpaRepository<PostTaggedUser, PostTaggedUserId> {

    List<PostTaggedUser> findByPostId(UUID postId);

    @Query(
        """
        SELECT ptu
        FROM PostTaggedUser ptu
        WHERE ptu.postId IN (:postIds)
        """
    )
    List<PostTaggedUser> findByPostIds(@Param("postIds") List<UUID> postIds);
}
