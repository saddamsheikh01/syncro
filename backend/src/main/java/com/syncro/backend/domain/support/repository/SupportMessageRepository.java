package com.syncro.backend.domain.support.repository;

import com.syncro.backend.domain.support.entity.SupportMessage;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, UUID> {
}
