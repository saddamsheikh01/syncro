package com.syncro.backend.domain.tags.repository;

import com.syncro.backend.domain.tags.entity.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findAllByOrderByNameAsc();
}
