package com.syncro.backend.domain.email.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.dto.UpdateUserEmailPreferenceRequest;
import com.syncro.backend.domain.email.entity.UserEmailPreference;
import com.syncro.backend.domain.email.repository.UserEmailPreferenceRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailPreferencesService {

    private final UserRepository userRepository;
    private final UserEmailPreferenceRepository preferenceRepository;

    public EmailPreferencesService(
        UserRepository userRepository,
        UserEmailPreferenceRepository preferenceRepository
    ) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional
    public UserEmailPreference update(UUID userId, UpdateUserEmailPreferenceRequest request) {
        UserEmailPreference prefs = preferenceRepository.findByUserId(userId).orElseGet(() -> {
            UserEmailPreference p = new UserEmailPreference();
            p.setUserId(userId);
            userRepository.findById(userId).ifPresent(p::setUser);
            return preferenceRepository.save(p);
        });
        request.chatEnabled().ifPresent(prefs::setChatEnabled);
        request.connectionsEnabled().ifPresent(prefs::setConnectionsEnabled);
        request.matchEnabled().ifPresent(prefs::setMatchEnabled);
        request.eventsEnabled().ifPresent(prefs::setEventsEnabled);
        request.digestEnabled().ifPresent(prefs::setDigestEnabled);
        request.contentWeeklyDigest().ifPresent(prefs::setContentWeeklyDigest);
        request.chatMinMinutesBetween().ifPresent(prefs::setChatMinMinutesBetween);
        request.securityEnabled().ifPresent(prefs::setSecurityEnabled);
        request.testsProfileEnabled().ifPresent(prefs::setTestsProfileEnabled);
        request.feedMomentsEnabled().ifPresent(prefs::setFeedMomentsEnabled);
        return preferenceRepository.save(prefs);
    }
}
