package com.syncro.backend.domain.auth.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.dto.UpdateUserRequest;
import com.syncro.backend.domain.auth.dto.UserResponse;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.mapper.AuthMapper;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthMapper authMapper;

    public UserService(UserRepository userRepository, AuthMapper authMapper) {
        this.userRepository = userRepository;
        this.authMapper = authMapper;
    }

    public UserResponse getMe(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        return authMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UserPrincipal principal, UpdateUserRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        if (request.language() != null) {
            user.setLanguage(normalizeLanguage(request.language()));
        }
        if (request.onboardingCompleted() != null) {
            user.setOnboardingCompleted(request.onboardingCompleted());
        }

        User saved = userRepository.save(user);
        return authMapper.toUserResponse(saved);
    }

    private String normalizeLanguage(String language) {
        return language.trim().toLowerCase(Locale.ROOT);
    }
}
