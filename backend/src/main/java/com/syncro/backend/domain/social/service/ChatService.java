package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.social.dto.ChatConversationResponse;
import com.syncro.backend.domain.social.dto.ChatMessageRequest;
import com.syncro.backend.domain.social.dto.ChatMessageResponse;
import com.syncro.backend.domain.social.dto.CreateConversationRequest;
import com.syncro.backend.domain.social.entity.ChatConversation;
import com.syncro.backend.domain.social.entity.ChatMessage;
import com.syncro.backend.domain.social.entity.ChatParticipant;
import com.syncro.backend.domain.social.mapper.ChatMapper;
import com.syncro.backend.domain.social.repository.ChatConversationRepository;
import com.syncro.backend.domain.social.repository.ChatMessageRepository;
import com.syncro.backend.domain.social.repository.ChatParticipantRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

    private final UserRepository userRepository;
    private final ChatConversationRepository conversationRepository;
    private final ChatParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMapper chatMapper;

    public ChatService(
        UserRepository userRepository,
        ChatConversationRepository conversationRepository,
        ChatParticipantRepository participantRepository,
        ChatMessageRepository messageRepository,
        ChatMapper chatMapper
    ) {
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.chatMapper = chatMapper;
    }

    @Transactional
    public ChatConversationResponse createConversation(UserPrincipal principal, CreateConversationRequest request) {
        User user = getUser(principal);
        UUID otherUserId = request.otherUserId();
        if (otherUserId == null) {
            throw new BadRequestException("Utente non valido");
        }
        if (user.getId().equals(otherUserId)) {
            throw new BadRequestException("Non puoi creare una chat con te stesso");
        }
        User otherUser = userRepository.findById(otherUserId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));

        UUID existingConversationId = participantRepository.findPrivateConversationId(user.getId(), otherUserId);
        if (existingConversationId != null) {
            ChatConversation existing = conversationRepository.findById(existingConversationId)
                .orElseThrow(() -> new NotFoundException("Conversazione non trovata"));
            return chatMapper.toConversationResponse(existing, List.of(user.getId(), otherUserId));
        }

        ChatConversation conversation = new ChatConversation();
        ChatConversation saved = conversationRepository.save(conversation);

        List<ChatParticipant> participants = new ArrayList<>();
        participants.add(buildParticipant(saved, user));
        participants.add(buildParticipant(saved, otherUser));
        participantRepository.saveAll(participants);

        return chatMapper.toConversationResponse(saved, List.of(user.getId(), otherUserId));
    }

    @Transactional(readOnly = true)
    public Page<ChatConversationResponse> getConversations(UserPrincipal principal, int page, int size) {
        User user = getUser(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<ChatParticipant> participants = participantRepository.findByUserId(user.getId(), pageable);
        List<UUID> conversationIds = participants.getContent().stream()
            .map(ChatParticipant::getConversationId)
            .toList();
        Map<UUID, ChatConversation> conversations = conversationRepository.findAllById(conversationIds)
            .stream()
            .collect(Collectors.toMap(ChatConversation::getId, conversation -> conversation));
        Map<UUID, List<UUID>> participantsByConversation = loadParticipants(conversationIds);

        return participants.map(participant -> {
            ChatConversation conversation = conversations.get(participant.getConversationId());
            List<UUID> participantIds = participantsByConversation
                .getOrDefault(participant.getConversationId(), List.of());
            return chatMapper.toConversationResponse(conversation, participantIds);
        });
    }

    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(
        UserPrincipal principal,
        UUID conversationId,
        int page,
        int size
    ) {
        User user = getUser(principal);
        ensureParticipant(user.getId(), conversationId);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<ChatMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
            conversationId,
            pageable
        );
        return messages.map(chatMapper::toMessageResponse);
    }

    @Transactional
    public ChatMessageResponse sendMessage(
        UserPrincipal principal,
        UUID conversationId,
        ChatMessageRequest request
    ) {
        User user = getUser(principal);
        ensureParticipant(user.getId(), conversationId);
        String content = normalizeRequired(request.content());

        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setUser(user);
        message.setContent(content);
        ChatMessage saved = messageRepository.save(message);
        return chatMapper.toMessageResponse(saved);
    }

    private ChatParticipant buildParticipant(ChatConversation conversation, User user) {
        ChatParticipant participant = new ChatParticipant();
        participant.setConversation(conversation);
        participant.setUser(user);
        return participant;
    }

    private Map<UUID, List<UUID>> loadParticipants(List<UUID> conversationIds) {
        if (conversationIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, List<UUID>> map = new HashMap<>();
        for (UUID conversationId : conversationIds) {
            List<UUID> userIds = participantRepository.findAllByConversationId(conversationId)
                .stream()
                .map(ChatParticipant::getUserId)
                .toList();
            map.put(conversationId, userIds);
        }
        return map;
    }

    private void ensureParticipant(UUID userId, UUID conversationId) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new UnauthorizedException("Accesso alla conversazione negato");
        }
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

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Token mancante o non valido");
        }
        UUID userId = principal.userId();
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("Utente non trovato"));
    }
}
