package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.AuthProvider;
import com.syncro.backend.domain.auth.entity.UserAuthProvider;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, UUID> {

    Optional<UserAuthProvider> findByUserIdAndProvider(UUID userId, AuthProvider provider);
}
