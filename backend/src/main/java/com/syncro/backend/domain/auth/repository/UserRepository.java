package com.syncro.backend.domain.auth.repository;

import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.entity.UserStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdAndStatus(UUID id, UserStatus status);

    long countByOnboardingCompletedTrue();

    List<User> findAllByStatus(UserStatus status);

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

    @Query("""
        select u from User u
        where u.status = :status
          and (
            lower(coalesce(u.username, '')) like lower(concat('%', :q, '%'))
            or exists (
              select 1 from UserProfile p
              where p.user = u
                and lower(coalesce(p.fullName, '')) like lower(concat('%', :q, '%'))
            )
          )
        order by lower(coalesce(u.username, '')) asc, lower(coalesce(u.email, '')) asc
        """)
    Page<User> searchNotificationRecipients(
        @Param("q") String q,
        @Param("status") UserStatus status,
        Pageable pageable
    );
}
