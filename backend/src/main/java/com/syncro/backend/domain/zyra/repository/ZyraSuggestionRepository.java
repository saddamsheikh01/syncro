package com.syncro.backend.domain.zyra.repository;

import com.syncro.backend.domain.zyra.entity.ZyraSuggestion;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZyraSuggestionRepository extends JpaRepository<ZyraSuggestion, UUID> {

    Page<ZyraSuggestion> findByUserId(UUID userId, Pageable pageable);
}
