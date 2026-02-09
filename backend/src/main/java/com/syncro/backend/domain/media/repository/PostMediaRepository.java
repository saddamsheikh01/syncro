package com.syncro.backend.domain.media.repository;

import com.syncro.backend.domain.media.entity.MediaObject;
import com.syncro.backend.domain.media.entity.PostMedia;
import com.syncro.backend.domain.media.entity.PostMediaId;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostMediaRepository extends JpaRepository<PostMedia, PostMediaId> {

    @Query("select pm.media from PostMedia pm where pm.postId = :postId")
    Page<MediaObject> findMediaByPostId(@Param("postId") UUID postId, Pageable pageable);

    Optional<PostMedia> findByPostIdAndMediaId(UUID postId, UUID mediaId);
}
