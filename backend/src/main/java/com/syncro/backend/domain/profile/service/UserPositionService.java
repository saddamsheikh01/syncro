package com.syncro.backend.domain.profile.service;

import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.dto.UserPositionRequest;
import com.syncro.backend.domain.profile.dto.UserPositionResponse;
import com.syncro.backend.domain.profile.entity.UserPosition;
import com.syncro.backend.domain.profile.mapper.UserPositionMapper;
import com.syncro.backend.domain.profile.repository.UserPositionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPositionService {

    private static final Logger logger = LoggerFactory.getLogger(UserPositionService.class);

    private final UserRepository userRepository;
    private final UserPositionRepository positionRepository;
    private final UserPositionMapper positionMapper;
    private final OnboardingService onboardingService;

    public UserPositionService(
        UserRepository userRepository,
        UserPositionRepository positionRepository,
        UserPositionMapper positionMapper,
        OnboardingService onboardingService
    ) {
        this.userRepository = userRepository;
        this.positionRepository = positionRepository;
        this.positionMapper = positionMapper;
        this.onboardingService = onboardingService;
    }

    @Transactional(readOnly = true)
    public UserPositionResponse getPosition(UserPrincipal principal) {
        User user = getUser(principal);
        UserPosition position = positionRepository.findByUserId(user.getId())
            .orElseThrow(() -> new NotFoundException("Posizione non trovata"));
        return positionMapper.toResponse(position);
    }

    @Transactional
    public UserPositionResponse upsertPosition(UserPrincipal principal, UserPositionRequest request) {
        User user = getUser(principal);
        UserPosition position = positionRepository.findByUserId(user.getId())
            .orElseGet(UserPosition::new);

        position.setUserId(user.getId());
        position.setLatitude(request.latitude());
        position.setLongitude(request.longitude());
        position.setAccuracyMeters(request.accuracyMeters());

        logger.info(
            "Upsert position userId={}, positionUserId={}",
            user.getId(),
            position.getUserId()
        );

        UserPosition saved = positionRepository.save(position);
        onboardingService.refreshOnboardingStatus(user);
        return positionMapper.toResponse(saved);
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
