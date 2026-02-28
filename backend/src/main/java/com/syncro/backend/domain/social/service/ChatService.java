package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ForbiddenException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.common.exception.UnauthorizedException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.media.entity.MediaOwnerType;
import com.syncro.backend.domain.media.repository.MediaObjectRepository;
import com.syncro.backend.domain.profile.entity.UserProfile;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.dto.ChatConversationResponse;
import com.syncro.backend.domain.social.dto.ChatMessageRequest;
import com.syncro.backend.domain.social.dto.ChatMessageResponse;
import com.syncro.backend.domain.social.dto.ChatParticipantInfo;
import com.syncro.backend.domain.social.dto.CreateConversationRequest;
import com.syncro.backend.domain.social.entity.ChatConversation;
import com.syncro.backend.domain.social.entity.ChatMessage;
import com.syncro.backend.domain.social.entity.ChatParticipant;
import com.syncro.backend.domain.social.mapper.ChatMapper;
import com.syncro.backend.domain.social.repository.ChatConversationRepository;
import com.syncro.backend.domain.social.repository.ChatMessageRepository;
import com.syncro.backend.domain.social.repository.ChatParticipantRepository;
import com.syncro.backend.domain.notifications.service.NotificationService;
import com.syncro.backend.domain.social.service.ConnectionService;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.security.UserPrincipal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final UserProfileRepository profileRepository;
    private final MediaObjectRepository mediaObjectRepository;
    private final ChatConversationRepository conversationRepository;
    private final ChatParticipantRepository participantRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMapper chatMapper;
    private final NotificationService notificationService;
    private final ConnectionService connectionService;
    private final EmailNotificationService emailNotificationService;

    public ChatService(
        UserRepository userRepository,
        UserProfileRepository profileRepository,
        MediaObjectRepository mediaObjectRepository,
        ChatConversationRepository conversationRepository,
        ChatParticipantRepository participantRepository,
        ChatMessageRepository messageRepository,
        ChatMapper chatMapper,
        NotificationService notificationService,
        ConnectionService connectionService,
        EmailNotificationService emailNotificationService
    ) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.mediaObjectRepository = mediaObjectRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.chatMapper = chatMapper;
        this.notificationService = notificationService;
        this.connectionService = connectionService;
        this.emailNotificationService = emailNotificationService;
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

        if (!connectionService.hasActiveConnection(user.getId(), otherUserId)) {
            throw new ForbiddenException("Connection required to chat. Send a connection request and wait for acceptance.");
        }

        List<UUID> participantIds = List.of(user.getId(), otherUserId);

        UUID existingConversationId = participantRepository.findPrivateConversationId(user.getId(), otherUserId);
        if (existingConversationId != null) {
            ChatConversation existing = conversationRepository.findById(existingConversationId)
                .orElseThrow(() -> new NotFoundException("Conversazione non trovata"));
            List<ChatParticipantInfo> participantInfos = loadParticipantInfos(participantIds);
            ChatMessage lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(existingConversationId)
                .orElse(null);
            return chatMapper.toConversationResponse(existing, participantIds, participantInfos, lastMessage);
        }

        ChatConversation conversation = new ChatConversation();
        ChatConversation saved = conversationRepository.save(conversation);

        List<ChatParticipant> participants = new ArrayList<>();
        participants.add(buildParticipant(saved, user));
        participants.add(buildParticipant(saved, otherUser));
        participantRepository.saveAll(participants);

        List<ChatParticipantInfo> participantInfos = loadParticipantInfos(participantIds);
        return chatMapper.toConversationResponse(saved, participantIds, participantInfos, null);
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

        Set<UUID> allUserIds = participantsByConversation.values().stream()
            .flatMap(List::stream)
            .collect(Collectors.toSet());
        Map<UUID, ChatParticipantInfo> userInfoMap = loadUserInfoMap(allUserIds);

        Map<UUID, ChatMessage> lastMessages = loadLastMessages(conversationIds);

        return participants.map(participant -> {
            ChatConversation conversation = conversations.get(participant.getConversationId());
            List<UUID> participantIds = participantsByConversation
                .getOrDefault(participant.getConversationId(), List.of());
            List<ChatParticipantInfo> participantInfos = participantIds.stream()
                .map(id -> userInfoMap.getOrDefault(id, new ChatParticipantInfo(id, null, null, true)))
                .toList();
            ChatMessage lastMessage = lastMessages.get(participant.getConversationId());
            return chatMapper.toConversationResponse(conversation, participantIds, participantInfos, lastMessage);
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
        ensureActiveConnection(conversationId, user.getId());
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
        ensureActiveConnection(conversationId, user.getId());
        String content = normalizeRequired(request.content());

        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setUser(user);
        message.setContent(content);
        ChatMessage saved = messageRepository.save(message);
        List<UUID> recipientIds = participantRepository.findAllByConversationId(conversationId)
            .stream()
            .map(ChatParticipant::getUserId)
            .filter(userId -> !userId.equals(user.getId()))
            .toList();
        notificationService.createMessageNotifications(conversationId, saved, recipientIds);
        String senderDisplayName = resolveParticipantInfo(user.getId()).fullName();
        for (UUID recipientId : recipientIds) {
            try {
                emailNotificationService.sendNewMessageWhenOffline(
                    recipientId,
                    senderDisplayName != null ? senderDisplayName : user.getUsername(),
                    conversationId
                );
            } catch (Exception ignored) { }
        }
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

    private List<ChatParticipantInfo> loadParticipantInfos(List<UUID> userIds) {
        return userIds.stream()
            .map(this::resolveParticipantInfo)
            .toList();
    }

    private Map<UUID, ChatParticipantInfo> loadUserInfoMap(Set<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, ChatParticipantInfo> map = new HashMap<>();
        for (UUID userId : userIds) {
            map.put(userId, resolveParticipantInfo(userId));
        }
        return map;
    }

    private ChatParticipantInfo resolveParticipantInfo(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        String displayName = null;
        boolean profileIncomplete = true;
        if (user != null) {
            UserProfile profile = profileRepository.findByUserId(userId).orElse(null);
            if (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()) {
                displayName = profile.getFullName().trim();
                profileIncomplete = false;
            }
            if (displayName == null && user.getUsername() != null && !user.getUsername().isBlank()) {
                displayName = user.getUsername();
            }
            if (displayName == null && user.getEmail() != null && !user.getEmail().isBlank()) {
                displayName = user.getEmail();
            }
        }
        if (displayName == null || displayName.isBlank()) {
            displayName = "User";
        }
        String avatarUrl = resolveAvatarUrl(userId);
        return chatMapper.toParticipantInfo(userId, displayName, avatarUrl, profileIncomplete);
    }

    private String resolveAvatarUrl(UUID userId) {
        if (userId == null) {
            return null;
        }
        return mediaObjectRepository
            .findFirstByOwnerTypeAndOwnerIdOrderByCreatedAtDesc(MediaOwnerType.USER_PROFILE, userId)
            .map(media -> media.getUrl())
            .orElse(null);
    }

    private Map<UUID, ChatMessage> loadLastMessages(List<UUID> conversationIds) {
        if (conversationIds.isEmpty()) {
            return Map.of();
        }
        List<ChatMessage> lastMessages = messageRepository.findLastMessagesByConversationIds(conversationIds);
        return lastMessages.stream()
            .collect(Collectors.toMap(ChatMessage::getConversationId, msg -> msg));
    }

    private void ensureParticipant(UUID userId, UUID conversationId) {
        if (!participantRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new UnauthorizedException("Accesso alla conversazione negato");
        }
    }

    private void ensureActiveConnection(UUID conversationId, UUID currentUserId) {
        List<ChatParticipant> participants = participantRepository.findAllByConversationId(conversationId);
        UUID otherUserId = participants.stream()
            .map(ChatParticipant::getUserId)
            .filter(id -> !id.equals(currentUserId))
            .findFirst()
            .orElse(null);
        if (otherUserId == null || !connectionService.hasActiveConnection(currentUserId, otherUserId)) {
            throw new ForbiddenException("Connection required to chat. Send a connection request and wait for acceptance.");
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
