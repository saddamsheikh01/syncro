package com.syncro.backend.domain.email.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.dto.UpdateUserEmailPreferenceRequest;
import com.syncro.backend.domain.email.entity.UserEmailPreference;
import com.syncro.backend.domain.email.repository.UserEmailPreferenceRepository;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailPreferencesService {

    private final UserRepository userRepository;
    private final UserEmailPreferenceRepository preferenceRepository;
    private final EntityManager entityManager;

    public EmailPreferencesService(
        UserRepository userRepository,
        UserEmailPreferenceRepository preferenceRepository,
        EntityManager entityManager
    ) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public UserEmailPreference update(UUID userId, UpdateUserEmailPreferenceRequest request) {
        UserEmailPreference prefs = preferenceRepository.findById(userId).orElseGet(() -> {
            UserEmailPreference p = new UserEmailPreference();
            p.setUser(userRepository.getReferenceById(userId));
            entityManager.persist(p);
            return p;
        });
        request.chatEnabled().ifPresent(prefs::setChatEnabled);
        request.connectionsEnabled().ifPresent(prefs::setConnectionsEnabled);
        request.matchEnabled().ifPresent(prefs::setMatchEnabled);
        request.eventsEnabled().ifPresent(prefs::setEventsEnabled);
        request.digestEnabled().ifPresent(prefs::setDigestEnabled);
        request.contentWeeklyDigest().ifPresent(prefs::setContentWeeklyDigest);
        request.chatMinMinutesBetween().ifPresent(v -> {
            if (v < 1 || v > 1440) throw new BadRequestException("chatMinMinutesBetween must be between 1 and 1440");
            prefs.setChatMinMinutesBetween(v);
        });
        request.securityEnabled().ifPresent(prefs::setSecurityEnabled);
        request.testsProfileEnabled().ifPresent(prefs::setTestsProfileEnabled);
        request.feedMomentsEnabled().ifPresent(prefs::setFeedMomentsEnabled);
        return preferenceRepository.save(prefs);
    }
}
