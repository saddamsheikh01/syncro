package com.syncro.backend.domain.zyra.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.config.ZyraProperties;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.catalog.entity.Place;
import com.syncro.backend.domain.catalog.entity.PlaceTag;
import com.syncro.backend.domain.catalog.repository.PlaceRepository;
import com.syncro.backend.domain.catalog.repository.PlaceTagRepository;
import com.syncro.backend.domain.profile.entity.ProfileVisibility;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.entity.ChatMessage;
import com.syncro.backend.domain.social.entity.ChatParticipant;
import com.syncro.backend.domain.social.repository.ChatMessageRepository;
import com.syncro.backend.domain.social.repository.ChatParticipantRepository;
import com.syncro.backend.domain.tags.entity.UserInterest;
import com.syncro.backend.domain.tags.entity.Tag;
import com.syncro.backend.domain.tags.repository.UserInterestRepository;
import com.syncro.backend.domain.tags.repository.TagRepository;
import com.syncro.backend.domain.tests.entity.UserPsyProfile;
import com.syncro.backend.domain.tests.repository.UserPsyProfileRepository;
import com.syncro.backend.domain.zyra.client.ZyraChatMessage;
import com.syncro.backend.domain.zyra.client.ZyraClient;
import com.syncro.backend.domain.zyra.dto.ZyraChatResponse;
import com.syncro.backend.domain.zyra.dto.ZyraMessageRequest;
import com.syncro.backend.domain.zyra.dto.ZyraMessageResponse;
import com.syncro.backend.domain.zyra.dto.ZyraPlaceRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSessionResponse;
import com.syncro.backend.domain.zyra.dto.ZyraSuggestionRequest;
import com.syncro.backend.domain.zyra.dto.ZyraChatRecapResponse;
import com.syncro.backend.domain.zyra.dto.ZyraProfileRecapResponse;
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
    private final PlaceRepository placeRepository;
    private final PlaceTagRepository placeTagRepository;
    private final TagRepository tagRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
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
        PlaceRepository placeRepository,
        PlaceTagRepository placeTagRepository,
        TagRepository tagRepository,
        ChatParticipantRepository chatParticipantRepository,
        ChatMessageRepository chatMessageRepository,
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
        this.placeRepository = placeRepository;
        this.placeTagRepository = placeTagRepository;
        this.tagRepository = tagRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
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
    public void deleteSession(UserPrincipal principal, UUID sessionId) {
        User user = getUser(principal);
        ZyraChatSession session = getSession(user.getId(), sessionId);
        sessionRepository.delete(session);
    }

    @Transactional
    public void deleteAllSessions(UserPrincipal principal) {
        User user = getUser(principal);
        sessionRepository.deleteByUserId(user.getId());
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

    @Transactional(readOnly = true)
    public ZyraProfileRecapResponse getProfileRecap(UserPrincipal principal) {
        User user = getUser(principal);
        String recap = generateProfileRecap(user);
        return new ZyraProfileRecapResponse(recap, java.time.Instant.now());
    }

    @Transactional(readOnly = true)
    public ZyraProfileRecapResponse getProfileRecapForUser(UserPrincipal principal, UUID userId) {
        getUser(principal);
        if (userId == null) {
            throw new NotFoundException("Utente non valido");
        }
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
        ensureProfilePublic(target.getId());
        String recap = generateProfileRecap(target);
        return new ZyraProfileRecapResponse(recap, java.time.Instant.now());
    }

    @Transactional(readOnly = true)
    public ZyraPlaceRecapResponse getPlaceRecap(UserPrincipal principal, UUID placeId) {
        User user = getUser(principal);
        if (placeId == null) {
            throw new NotFoundException("Luogo non valido");
        }
        Place place = placeRepository.findById(placeId)
            .orElseThrow(() -> new NotFoundException("Luogo non trovato"));
        String recap = generatePlaceRecap(user, place);
        return new ZyraPlaceRecapResponse(recap, java.time.Instant.now());
    }

    private String generateProfileRecap(User user) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        UserPsyProfile psyProfile = userPsyProfileRepository.findByUserId(user.getId()).orElse(null);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo del profilo utente (2-3 frasi, tono amichevole e personale). ");
        prompt.append("Scrivi in prima persona come se fosse l'utente a descriversi. ");
        prompt.append("Esempio: 'Sono una persona curiosa che ama viaggiare...'. ");
        prompt.append("Dati disponibili:\n");

        if (profile != null) {
            if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                prompt.append("- Nome: ").append(profile.getFullName()).append("\n");
            }
            if (profile.getCity() != null && !profile.getCity().isBlank()) {
                prompt.append("- Citta: ").append(profile.getCity()).append("\n");
            }
            if (profile.getCountry() != null && !profile.getCountry().isBlank()) {
                prompt.append("- Paese: ").append(profile.getCountry()).append("\n");
            }
            if (profile.getBirthDate() != null) {
                prompt.append("- Eta: ").append(formatAge(profile.getBirthDate())).append(" anni\n");
            }
            if (profile.getBio() != null && !profile.getBio().isBlank()) {
                prompt.append("- Bio: ").append(profile.getBio()).append("\n");
            }
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                prompt.append("- Lavoro: ").append(jobLabel).append("\n");
            }
        }

        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                prompt.append("- Interessi: ").append(interestNames).append("\n");
            }
        }

        if (psyProfile != null && psyProfile.getProfile() != null && !psyProfile.getProfile().isEmpty()) {
            prompt.append("- Profilo psicologico: ").append(safeJson(psyProfile.getProfile())).append("\n");
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi profilo brevi e coinvolgenti."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Completa il tuo profilo per un riepilogo personalizzato.";
        } catch (Exception ex) {
            return "Completa il tuo profilo per un riepilogo personalizzato.";
        }
    }

    private String generatePlaceRecap(User user, Place place) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        List<UserInterest> interests = userInterestRepository.findAllByUserId(user.getId());
        List<String> placeTags = loadPlaceTags(place.getId());

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo (2-3 frasi) che spiega quanto questo luogo e adatto all'utente. ");
        prompt.append("Confronta interessi e profilo con le caratteristiche del luogo. ");
        prompt.append("Se mancano dati, rimani generico e non inventare. ");
        prompt.append("Tono amichevole e diretto. Nessuna lista.\n");
        prompt.append("Dati utente:\n");

        if (profile != null) {
            if (profile.getFullName() != null && !profile.getFullName().isBlank()) {
                prompt.append("- Nome: ").append(profile.getFullName()).append("\n");
            }
            if (profile.getCity() != null && !profile.getCity().isBlank()) {
                prompt.append("- Citta: ").append(profile.getCity()).append("\n");
            }
            if (profile.getCountry() != null && !profile.getCountry().isBlank()) {
                prompt.append("- Paese: ").append(profile.getCountry()).append("\n");
            }
            if (profile.getBirthDate() != null) {
                prompt.append("- Eta: ").append(formatAge(profile.getBirthDate())).append(" anni\n");
            }
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                prompt.append("- Lavoro: ").append(jobLabel).append("\n");
            }
            if (profile.getBio() != null && !profile.getBio().isBlank()) {
                prompt.append("- Bio: ").append(profile.getBio()).append("\n");
            }
        }

        if (!interests.isEmpty()) {
            String interestNames = interests.stream()
                .map(interest -> interest.getTag() != null ? interest.getTag().getName() : null)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!interestNames.isBlank()) {
                prompt.append("- Interessi: ").append(interestNames).append("\n");
            }
        }

        prompt.append("Dati luogo:\n");
        prompt.append("- Nome: ").append(place.getName()).append("\n");
        if (place.getCategory() != null && place.getCategory().getName() != null) {
            prompt.append("- Categoria: ").append(place.getCategory().getName()).append("\n");
        }
        if (place.getDescription() != null && !place.getDescription().isBlank()) {
            prompt.append("- Descrizione: ").append(place.getDescription()).append("\n");
        }
        if (place.getCity() != null && !place.getCity().isBlank()) {
            prompt.append("- Citta: ").append(place.getCity()).append("\n");
        }
        if (place.getAddress() != null && !place.getAddress().isBlank()) {
            prompt.append("- Indirizzo: ").append(place.getAddress()).append("\n");
        }
        if (!placeTags.isEmpty()) {
            prompt.append("- Tag: ").append(String.join(", ", placeTags)).append("\n");
        }
        if (place.getGoogleTypes() != null && !place.getGoogleTypes().isEmpty()) {
            String types = place.getGoogleTypes().stream()
                .filter(type -> type != null && !type.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
            if (!types.isBlank()) {
                prompt.append("- Tipi Google: ").append(types).append("\n");
            }
        }
        if (place.getGoogleRating() != null) {
            prompt.append("- Rating Google: ").append(place.getGoogleRating()).append("\n");
        }
        if (place.getGoogleReviewCount() != null && place.getGoogleReviewCount() > 0) {
            prompt.append("- Recensioni: ").append(place.getGoogleReviewCount()).append("\n");
        }
        if (place.getPriceLevel() != null) {
            prompt.append("- Prezzo: ").append(formatPriceLevel(place.getPriceLevel())).append("\n");
        }
        Boolean openNow = extractOpenNow(place.getOpeningHours());
        if (openNow != null) {
            prompt.append("- Stato attuale: ").append(openNow ? "Aperto ora" : "Chiuso ora").append("\n");
        }

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi brevi e utili."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Luogo interessante: aggiorna il profilo per un match piu preciso.";
        } catch (Exception ex) {
            return "Luogo interessante: aggiorna il profilo per un match piu preciso.";
        }
    }

    @Transactional(readOnly = true)
    public ZyraChatRecapResponse getChatRecap(UserPrincipal principal) {
        User user = getUser(principal);

        // Get user's recent conversations (last 5)
        PageRequest pageable = PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt")));
        List<ChatParticipant> participants = chatParticipantRepository.findByUserId(user.getId(), pageable).getContent();

        if (participants.isEmpty()) {
            return new ZyraChatRecapResponse(
                "Non hai ancora conversazioni. Inizia a chattare con qualcuno per vedere un riepilogo qui!",
                0,
                List.of(),
                java.time.Instant.now()
            );
        }

        List<UUID> conversationIds = participants.stream()
            .map(ChatParticipant::getConversationId)
            .toList();

        // Build conversation summaries for prompt
        StringBuilder conversationData = new StringBuilder();
        List<String> recentContacts = new ArrayList<>();

        for (UUID conversationId : conversationIds) {
            // Get other participant name
            List<ChatParticipant> convParticipants = chatParticipantRepository.findAllByConversationId(conversationId);
            ChatParticipant otherParticipant = convParticipants.stream()
                .filter(p -> !p.getUserId().equals(user.getId()))
                .findFirst()
                .orElse(null);

            String otherName = "Utente";
            if (otherParticipant != null) {
                UserProfile otherProfile = userProfileRepository.findByUserId(otherParticipant.getUserId()).orElse(null);
                if (otherProfile != null && otherProfile.getFullName() != null) {
                    otherName = otherProfile.getFullName();
                }
            }
            recentContacts.add(otherName);

            // Get last 5 messages from this conversation
            PageRequest msgPageable = PageRequest.of(0, 5, Sort.by(Sort.Order.desc("createdAt")));
            List<ChatMessage> messages = chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, msgPageable).getContent();

            if (!messages.isEmpty()) {
                conversationData.append("Conversazione con ").append(otherName).append(":\n");
                List<ChatMessage> orderedMessages = new ArrayList<>(messages);
                Collections.reverse(orderedMessages);
                for (ChatMessage msg : orderedMessages) {
                    String sender = msg.getUser().getId().equals(user.getId()) ? "Tu" : otherName;
                    String content = msg.getContent().length() > 100
                        ? msg.getContent().substring(0, 100) + "..."
                        : msg.getContent();
                    conversationData.append("- ").append(sender).append(": ").append(content).append("\n");
                }
                conversationData.append("\n");
            }
        }

        String recap = generateChatRecap(conversationData.toString(), conversationIds.size());

        return new ZyraChatRecapResponse(
            recap,
            conversationIds.size(),
            recentContacts,
            java.time.Instant.now()
        );
    }

    private String generateChatRecap(String conversationData, int conversationCount) {
        if (conversationData.isBlank()) {
            return "Le tue conversazioni sono ancora vuote. Inizia a scambiare messaggi!";
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("Genera un breve riepilogo delle conversazioni recenti dell'utente (2-3 frasi, tono amichevole). ");
        prompt.append("Menziona con chi ha parlato e gli argomenti principali discussi. ");
        prompt.append("Scrivi in seconda persona rivolgendoti all'utente. ");
        prompt.append("Esempio: 'Hai chiacchierato con Marco di viaggi e con Sara di musica...'. ");
        prompt.append("Ecco le conversazioni recenti:\n\n");
        prompt.append(conversationData);

        List<ZyraChatMessage> messages = List.of(
            new ZyraChatMessage("system", "Sei Zyra, un assistente AI di Syncro. Genera riepiloghi delle chat brevi e coinvolgenti."),
            new ZyraChatMessage("user", prompt.toString())
        );

        try {
            String recap = zyraClient.chat(messages);
            return recap != null ? recap.trim() : "Hai " + conversationCount + " conversazioni attive.";
        } catch (Exception ex) {
            return "Hai " + conversationCount + " conversazioni attive.";
        }
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
            String jobLabel = buildJobLabel(profile);
            if (jobLabel != null) {
                builder.append("- lavoro: ").append(jobLabel).append("\n");
            }
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

    private List<String> loadPlaceTags(UUID placeId) {
        if (placeId == null) {
            return Collections.emptyList();
        }
        List<PlaceTag> links = placeTagRepository.findAllByPlaceId(placeId);
        if (links.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> tagIds = links.stream()
            .map(PlaceTag::getTagId)
            .filter(id -> id != null)
            .distinct()
            .toList();
        if (tagIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Tag> tags = tagRepository.findAllById(tagIds);
        return tags.stream()
            .map(Tag::getName)
            .filter(name -> name != null && !name.isBlank())
            .distinct()
            .collect(Collectors.toList());
    }

    private String formatPriceLevel(Integer level) {
        if (level == null) {
            return null;
        }
        return switch (level) {
            case 0 -> "Gratis";
            case 1 -> "Economico";
            case 2 -> "Medio";
            case 3 -> "Costoso";
            case 4 -> "Molto costoso";
            default -> "Non disponibile";
        };
    }

    private Boolean extractOpenNow(Map<String, Object> openingHours) {
        if (openingHours == null || openingHours.isEmpty()) {
            return null;
        }
        Object openNow = openingHours.get("openNow");
        if (openNow instanceof Boolean value) {
            return value;
        }
        return null;
    }

    private String buildJobLabel(UserProfile profile) {
        if (profile == null) {
            return null;
        }
        String title = normalizeOptional(profile.getJobTitle());
        String company = normalizeOptional(profile.getCompanyName());
        if (title == null && company == null) {
            return null;
        }
        if (title != null && company != null) {
            return title + " @ " + company;
        }
        return title != null ? title : company;
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

    private void ensureProfilePublic(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            throw new NotFoundException("Profilo non disponibile");
        }
        if (profile.getVisibility() == ProfileVisibility.PRIVATE) {
            throw new NotFoundException("Profilo privato. L'utente non rende visibili i dettagli.");
        }
    }
}
