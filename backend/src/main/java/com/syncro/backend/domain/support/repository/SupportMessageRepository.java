package com.syncro.backend.domain.support.repository;

import com.syncro.backend.domain.support.entity.SupportCategory;
import com.syncro.backend.domain.support.entity.SupportMessage;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, UUID> {
    @Query(
        """
        select sm
        from SupportMessage sm
        left join sm.user u
        where (:category is null or sm.category = :category)
          and (
            :q = ''
            or lower(sm.subject) like concat('%', :q, '%')
            or lower(sm.message) like concat('%', :q, '%')
            or (u.email is not null and lower(u.email) like concat('%', :q, '%'))
            or (u.username is not null and lower(u.username) like concat('%', :q, '%'))
          )
        """
    )
    Page<SupportMessage> search(
        @Param("q") String q,
        @Param("category") SupportCategory category,
        Pageable pageable
    );
}
