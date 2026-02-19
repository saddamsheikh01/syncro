package com.syncro.backend.domain.support.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.support.dto.SupportMessageRequest;
import com.syncro.backend.domain.support.entity.SupportMessage;
import com.syncro.backend.domain.support.repository.SupportMessageRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportService {

    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;

    public SupportService(
        SupportMessageRepository supportMessageRepository,
        UserRepository userRepository
    ) {
        this.supportMessageRepository = supportMessageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void submit(UserPrincipal principal, SupportMessageRequest request) {
        User user = getUser(principal);
        String subject = request.subject() != null ? request.subject().trim() : "";
        String message = request.message() != null ? request.message().trim() : "";
        if (subject.isEmpty()) {
            throw new BadRequestException("Subject is required");
        }
        if (message.isEmpty()) {
            throw new BadRequestException("Message is required");
        }

        SupportMessage entity = new SupportMessage();
        entity.setUser(user);
        entity.setSubject(subject);
        entity.setMessage(message);
        entity.setCategory(request.category());
        supportMessageRepository.save(entity);
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
