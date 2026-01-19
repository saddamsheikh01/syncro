package com.syncro.backend.domain.zyra.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.config.ZyraProperties;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.zyra.client.ZyraChatMessage;
import com.syncro.backend.domain.zyra.client.ZyraClient;
import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionResponse;
import com.syncro.backend.domain.zyra.entity.ZyraChatSession;
import com.syncro.backend.domain.zyra.entity.ZyraMessage;
import com.syncro.backend.domain.zyra.entity.ZyraMessageRole;
import com.syncro.backend.domain.zyra.entity.ZyraSuggestion;
import com.syncro.backend.domain.zyra.mapper.ZyraMapper;
import com.syncro.backend.domain.zyra.repository.ZyraChatSessionRepository;
import com.syncro.backend.domain.zyra.repository.ZyraMessageRepository;
import com.syncro.backend.domain.zyra.repository.ZyraSuggestionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ZyraService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserPsyProfileRepository userPsyProfileRepository;
    private final ZyraChatSessionRepository sessionRepository;
    private final ZyraMessageRepository messageRepository;
    private final ZyraSuggestionRepository suggestionRepository;
    private final ZyraClient zyraClient;
    private final ZyraMapper zyraMapper;
    private final ObjectMapper objectMapper;
    private final int maxHistory;
    private final String systemPrompt;

    public ZyraService(
        UserRepository userRepository,
        UserProfileRepository userProfileRepository,
        UserInterestRepository userInterestRepository,
        UserPsyProfileRepository userPsyProfileRepository,
        ZyraChatSessionRepository sessionRepository,
        ZyraMessageRepository messageRepository,
        ZyraSuggestionRepository suggestionRepository,
        ZyraClient zyraClient,
        ZyraMapper zyraMapper,
        ObjectMapper objectMapper,
        ZyraProperties zyraProperties
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.userInterestRepository = userInterestRepository;
        this.userPsyProfileRepository = userPsyProfileRepository;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.suggestionRepository = suggestionRepository;
        this.zyraClient = zyraClient;
        this.zyraMapper = zyraMapper;
        this.objectMapper = objectMapper;
        this.maxHistory = zyraProperties.maxHistory();
        this.systemPrompt = zyraProperties.systemPrompt().trim();
    }

    @Transactional
    public ZyraSessionResponse createSession(UserPrincipal principal) {
        User user = getUser(principal);
        ZyraChatSession session = new ZyraChatSession();
        session.setUser(user);
        ZyraChatSession saved = sessionRepository.save(session);
        return zyraMapper.toSessionResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ZyraSessionResponse> getSessions(UserPrincipal principal, int page, int size) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return sessionRepository.findByUserId(user.getId(), pageable)
            .map(zyraMapper::toSessionResponse);
    }

    @Transactional(readOnly = true)
    public Page<ZyraMessageResponse> getMessages(
        UserPrincipal principal,
        UUID sessionId,
        int page,
        int size
    ) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return messageRepository.findBySessionId(session.getId(), pageable)
            .map(zyraMapper::toMessageResponse);
    }

    @Transactional
    public ZyraChatResponse sendMessage(
        UserPrincipal principal,
        UUID sessionId,
        ZyraMessageRequest request
    ) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        String content = normalizeRequired(request.content());

        ZyraMessage userMessage = new ZyraMessage();
        userMessage.setSession(session);
        userMessage.setRole(ZyraMessageRole.USER);
        userMessage.setContent(content);
        ZyraMessage savedUserMessage = messageRepository.save(userMessage);

        String sessionTitle = session.getTitle();
        if (sessionTitle == null || sessionTitle.isBlank()) {
            String fallbackTitle = buildFallbackTitle(content);
            session.setTitle(fallbackTitle);
            sessionRepository.save(session);
            sessionTitle = fallbackTitle;

            String firstMessage = content;
            UUID sessionIdForAsync = session.getId();
            CompletableFuture.runAsync(() -> {
                String generatedTitle = generateSessionTitle(firstMessage);
                if (generatedTitle != null && !generatedTitle.isBlank()) {
                    sessionRepository.findById(sessionIdForAsync).ifPresent(s -> {
                        s.setTitle(generatedTitle);
                        sessionRepository.save(s);
                    });
                }
            });
        }

        List<ZyraChatMessage> promptMessages = buildPromptMessages(user, session.getId());
        String assistantReply = zyraClient.chat(promptMessages);

        ZyraMessage assistantMessage = new ZyraMessage();
        assistantMessage.setSession(session);
        assistantMessage.setRole(ZyraMessageRole.ASSISTANT);
        assistantMessage.setContent(assistantReply);
        ZyraMessage savedAssistantMessage = messageRepository.save(assistantMessage);

        return new ZyraChatResponse(
            zyraMapper.toMessageResponse(savedUserMessage),
            zyraMapper.toMessageResponse(savedAssistantMessage),
            sessionTitle
        );
    }

    @Transactional(readOnly = true)
    public Page<ZyraSuggestionResponse> getSuggestions(UserPrincipal principal, int page, int size) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        return suggestionRepository.findByUserId(user.getId(), pageable)
            .map(zyraMapper::toSuggestionResponse);
    }

    @Transactional
    public ZyraSuggestionResponse createSuggestion(
        UserPrincipal principal,
        ZyraSuggestionRequest request
    ) {
        User user = getUser(principal);
        String context = normalizeOptional(request.context());
        String prompt = buildSuggestionPrompt(request, context);
        List<ZyraChatMessage> messages = buildSuggestionMessages(user, prompt);
        String reply = zyraClient.chat(messages);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", reply);
        if (context != null) {
            payload.put("context", context);
        }

        ZyraSuggestion suggestion = new ZyraSuggestion();
        suggestion.setUser(user);
        suggestion.setSuggestionType(request.suggestionType());
        suggestion.setPayload(payload);

        ZyraSuggestion saved = suggestionRepository.save(suggestion);
        return zyraMapper.toSuggestionResponse(saved);
    }

    private List<ZyraChatMessage> buildPromptMessages(User user, UUID sessionId) {
        List<ZyraChatMessage> messages = new ArrayList<>();
        messages.add(new ZyraChatMessage("system", buildSystemPrompt(user)));

        PageRequest pageable = PageRequest.of(0, maxHistory, Sort.by(Sort.Order.desc("createdAt")));
        List<ZyraMessage> history = messageRepository.findBySessionId(sessionId, pageable).getContent();
        if (!history.isEmpty()) {
            List<ZyraMessage> ordered = new ArrayList<>(history);
            Collections.reverse(ordered); // cronologico
            for (ZyraMessage message : ordered) {
                messages.add(new ZyraChatMessage(mapRole(message.getRole()), message.getContent()));
            }
        }
        return messages;
    }

    private List<ZyraChatMessage> buildSuggestionMessages(User user, String prompt) {
        List<ZyraChatMessage> messages = new ArrayList<>();
        messages.add(new ZyraChatMessage("system", buildSystemPrompt(user)));
        messages.add(new ZyraChatMessage("user", prompt));
        return messages;
    }

    private String buildSystemPrompt(User user) {
        StringBuilder builder = new StringBuilder(systemPrompt);
        builder.append("\nContesto utente:\n");
        builder.append("- lingua: ").append(safeValue(user.getLanguage())).append("\n");

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            builder.append("- nome: ").append(safeValue(profile.getFullName())).append("\n");
            builder.append("- citta: ").append(safeValue(profile.getCity())).append("\n");
            builder.append("- paese: ").append(safeValue(profile.getCountry())).append("\n");
            builder.append("- eta: ").append(formatAge(profile.getBirthDate())).append("\n");
        }

        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                builder.append("- interessi: ").append(interestNames).append("\n");
            }
        }

        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);
        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            builder.append("- profilo_psicologico: ")
                .append(safeJson(psyProfile.getProfile()))
                .append("\n");
        }

        return builder.toString();
    }

    private String buildSuggestionPrompt(ZyraSuggestionRequest request, String context) {
        StringBuilder builder = new StringBuilder();
        builder.append("Genera un suggerimento personalizzato per l'utente. Tipo: ")
            .append(request.suggestionType().name())
            .append(".");
        if (context != null) {
            builder.append(" Contesto aggiuntivo: ").append(context);
        }
        return builder.toString();
    }

    private String mapRole(ZyraMessageRole role) {
        if (role == null) {
            return "user";
        }
        return switch (role) {
            case USER -> "user";
            case ASSISTANT -> "assistant";
            case SYSTEM -> "system";
        };
    }

    private String normalizeRequired(String value) {
        if (value == null) {
            throw new BadRequestException("Contenuto non valido");
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Contenuto non valido");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "n/d" : value;
    }

    private String formatAge(LocalDate birthDate) {
        if (birthDate == null) {
            return "n/d";
        }
        int years = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
        return years > 0 ? String.valueOf(years) : "n/d";
    }

    private String safeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return payload.toString();
        }
    }

    private String generateSessionTitle(String firstUserMessage) {
        String prompt = "Genera un titolo breve (max 48 caratteri) per questa chat, "
            + "basato sul primo messaggio utente. "
            + "Rispondi solo con il titolo, senza virgolette.";
        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", prompt),
            new ZyraChatMessage("user", firstUserMessage)
        );
        try {
            String title = zyraClient.chat(messages);
            if (title == null) {
                return null;
            }
            String normalized = title.trim();
            return normalized.isBlank() ? null : normalized.substring(0, Math.min(normalized.length(), 64));
        } catch (Exception ex) {
            return null;
        }
    }

    private String buildFallbackTitle(String content) {
        if (content == null || content.isBlank()) {
            return "Chat con Zyra";
        }
        String trimmed = content.trim();
        return trimmed.length() > 48 ? trimmed.substring(0, 48) + "..." : trimmed;
    }

    private ZyraChatSession getSession(UUID userId, UUID sessionId) {
        if (sessionId == null) {
            throw new BadRequestException("Sessione non valida");
        }
        return sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new NotFoundException("Sessione non trovata"));
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
