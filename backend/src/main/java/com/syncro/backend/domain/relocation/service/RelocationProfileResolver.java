package com.syncro.backend.domain.relocation.service;

import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.expats.entity.ExpatsAnonymousSession;
import com.syncro.backend.domain.expats.repository.ExpatsAnonymousSessionRepository;
import com.syncro.backend.domain.relocation.entity.RelocationProfile;
import com.syncro.backend.domain.relocation.repository.RelocationProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

/**
 * Centralizza il lookup del profilo relocation con auto-recovery per profili
 * orfani (creati durante il funnel anonimo ma mai collegati all'utente).
 */
@Service
public class RelocationProfileResolver {

    private static final Logger log = LoggerFactory.getLogger(RelocationProfileResolver.class);

    private final RelocationProfileRepository profileRepository;
    private final ExpatsAnonymousSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public RelocationProfileResolver(RelocationProfileRepository profileRepository,
                                     ExpatsAnonymousSessionRepository sessionRepository,
                                     UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Cerca il profilo relocation per userId. Se non lo trova, tenta il recovery
     * automatico cercando sessioni anonime convertite per questo utente.
     *
     * @throws ResponseStatusException 404 se il profilo non esiste e non e recuperabile.
     */
    @Transactional
    public RelocationProfile findOrRecover(UUID userId) {
        Optional<RelocationProfile> direct = profileRepository.findByUserId(userId);
        if (direct.isPresent()) {
            return direct.get();
        }

        // Recovery: cerca una sessione anonima convertita per questo utente
        Optional<ExpatsAnonymousSession> convertedSession = sessionRepository.findByConvertedUserId(userId);
        if (convertedSession.isPresent()) {
            ExpatsAnonymousSession session = convertedSession.get();

            // Cerca il profilo tramite la sessione convertita
            Optional<RelocationProfile> byConverted = profileRepository.findByConvertedFromSessionId(session.getId());
            if (byConverted.isPresent()) {
                return recoverProfile(byConverted.get(), userId);
            }

            // Cerca il profilo tramite anonymous_session_id (non ancora migrato)
            Optional<RelocationProfile> byAnon = profileRepository.findByAnonymousSession_Id(session.getId());
            if (byAnon.isPresent()) {
                return recoverProfile(byAnon.get(), userId);
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profilo relocation non trovato");
    }

    /**
     * Versione read-only che non modifica il DB. Per i casi in cui serve solo
     * leggere il profilo senza triggerare il recovery.
     */
    @Transactional(readOnly = true)
    public Optional<RelocationProfile> findOptional(UUID userId) {
        Optional<RelocationProfile> direct = profileRepository.findByUserId(userId);
        if (direct.isPresent()) {
            return direct;
        }

        Optional<ExpatsAnonymousSession> convertedSession = sessionRepository.findByConvertedUserId(userId);
        if (convertedSession.isPresent()) {
            ExpatsAnonymousSession session = convertedSession.get();
            Optional<RelocationProfile> byConverted = profileRepository.findByConvertedFromSessionId(session.getId());
            if (byConverted.isPresent()) return byConverted;
            return profileRepository.findByAnonymousSession_Id(session.getId());
        }

        return Optional.empty();
    }

    private RelocationProfile recoverProfile(RelocationProfile profile, UUID userId) {
        log.info("Auto-recovering orphan relocation profile {} for user {}", profile.getId(), userId);
        profile.setUser(userRepository.getReferenceById(userId));
        profile.setAnonymousSession(null);
        return profileRepository.save(profile);
    }
}
