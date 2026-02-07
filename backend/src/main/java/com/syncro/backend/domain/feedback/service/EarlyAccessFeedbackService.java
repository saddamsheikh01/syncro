package com.syncro.backend.domain.feedback.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.feedback.dto.EarlyAccessFeedbackRequest;
import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedback;
import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedbackChoice;
import com.syncro.backend.domain.feedback.entity.EarlyAccessFeedbackSource;
import com.syncro.backend.domain.feedback.repository.EarlyAccessFeedbackRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EarlyAccessFeedbackService {

    private final EarlyAccessFeedbackRepository earlyAccessFeedbackRepository;
    private final UserRepository userRepository;

    public EarlyAccessFeedbackService(
        EarlyAccessFeedbackRepository earlyAccessFeedbackRepository,
        UserRepository userRepository
    ) {
        this.earlyAccessFeedbackRepository = earlyAccessFeedbackRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void submit(UserPrincipal principal, EarlyAccessFeedbackRequest request) {
        User user = getUser(principal);
        EarlyAccessFeedbackChoice choice = request.choice();
        if (choice == null) {
            throw new BadRequestException("Feedback non valido");
        }

        String normalizedMessage = normalizeMessage(request.message());
        String messageToPersist = resolveMessage(choice, normalizedMessage);

        EarlyAccessFeedbackSource source = EarlyAccessFeedbackSource.EARLY_ACCESS_POPUP;
        if (earlyAccessFeedbackRepository.findByUserIdAndSource(user.getId(), source).isPresent()) {
            return;
        }

        EarlyAccessFeedback feedback = new EarlyAccessFeedback();
        feedback.setUser(user);
        feedback.setSource(source);
        feedback.setChoice(choice);
        feedback.setMessage(messageToPersist);
        feedback.setActiveSecondsBeforePrompt(request.activeSecondsBeforePrompt());
        earlyAccessFeedbackRepository.save(feedback);
    }

    private String resolveMessage(EarlyAccessFeedbackChoice choice, String normalizedMessage) {
        if (choice == EarlyAccessFeedbackChoice.SOMETHING_ELSE) {
            if (normalizedMessage == null) {
                throw new BadRequestException("Messaggio obbligatorio per la scelta selezionata");
            }
            return normalizedMessage;
        }
        return null;
    }

    private String normalizeMessage(String rawMessage) {
        if (rawMessage == null) {
            return null;
        }
        String trimmed = rawMessage.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
