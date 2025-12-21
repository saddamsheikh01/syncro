package com.syncro.backend.domain.auth.mapper;

import com.syncro.backend.domain.auth.dto.AdminUserResponse;
import com.syncro.backend.domain.auth.entity.AdminUser;
import org.springframework.stereotype.Component;

@Component
public class AdminAuthMapper {

    public AdminUserResponse toAdminResponse(AdminUser adminUser) {
        return new AdminUserResponse(
            adminUser.getId(),
            adminUser.getEmail(),
            adminUser.getRole().name(),
            adminUser.getStatus().name(),
            adminUser.getLastLogin(),
            adminUser.getCreatedAt()
        );
    }
}
