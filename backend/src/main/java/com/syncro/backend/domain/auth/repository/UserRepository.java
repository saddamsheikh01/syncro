package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    @Query("""
        select u from User u
        where (:email is null or lower(u.email) like lower(concat('%', :email, '%')))
          and (:status is null or u.status = :status)
          and (:onboardingCompleted is null or u.onboardingCompleted = :onboardingCompleted)
        """)
    Page<User> searchUsers(
        @Param("email") String email,
        @Param("status") UserStatus status,
        @Param("onboardingCompleted") Boolean onboardingCompleted,
        Pageable pageable
    );
}
