package com.syncro.backend.domain.auth.mapper;

import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getLanguage(),
            user.isOnboardingCompleted(),
            user.getStatus().name(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
