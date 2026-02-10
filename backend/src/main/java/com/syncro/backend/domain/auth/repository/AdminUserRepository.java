package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.AdminRole;
import com.syncro.backend.domain.auth.entity.AdminStatus;
import com.syncro.backend.domain.auth.entity.AdminUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

    Optional<AdminUser> findByEmail(String email);

    boolean existsByIdAndStatus(UUID id, AdminStatus status);

    @Query("""
        select a from AdminUser a
        where (:email is null or lower(a.email) like lower(concat('%', :email, '%')))
          and (:status is null or a.status = :status)
          and (:role is null or a.role = :role)
        """)
    Page<AdminUser> searchAdmins(
        @Param("email") String email,
        @Param("status") AdminStatus status,
        @Param("role") AdminRole role,
        Pageable pageable
    );
}
