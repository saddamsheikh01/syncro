package com.syncro.backend.domain.social.service;

import com.syncro.backend.common.exception.BadRequestException;
import com.syncro.backend.common.exception.ConflictException;
import com.syncro.backend.common.exception.NotFoundException;
import com.syncro.backend.domain.auth.entity.User;
import com.syncro.backend.domain.auth.repository.UserRepository;
import com.syncro.backend.domain.email.service.EmailNotificationService;
import com.syncro.backend.domain.notifications.service.NotificationService;
import com.syncro.backend.domain.profile.repository.UserProfileRepository;
import com.syncro.backend.domain.social.dto.ConnectionResponse;
import com.syncro.backend.domain.social.dto.SendConnectionRequest;
import com.syncro.backend.domain.social.entity.Connection;
import com.syncro.backend.domain.social.entity.ConnectionStatus;
import com.syncro.backend.domain.social.repository.ConnectionRepository;
import com.syncro.backend.security.UserPrincipal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConnectionService {

    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final NotificationService notificationService;
    private final UserProfileRepository profileRepository;
    private final EmailNotificationService emailNotificationService;

    public ConnectionService(
        UserRepository userRepository,
        ConnectionRepository connectionRepository,
        NotificationService notificationService,
        UserProfileRepository profileRepository,
        EmailNotificationService emailNotificationService
    ) {
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
        this.notificationService = notificationService;
        this.profileRepository = profileRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public ConnectionResponse sendRequest(UserPrincipal principal, SendConnectionRequest request) {
        User fromUser = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        UUID toUserId = request.toUserId();
        if (fromUser.getId().equals(toUserId)) {
            throw new BadRequestException("Cannot send connection request to yourself");
        }
        userRepository.findById(toUserId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        var existing = connectionRepository.findByFromUserIdAndToUserId(fromUser.getId(), toUserId);
        if (existing.isPresent()) {
            Connection conn = existing.get();
            ConnectionStatus status = conn.getStatus();
            if (status == ConnectionStatus.PENDING) {
                throw new ConflictException("Connection request already sent");
            }
            if (status == ConnectionStatus.ACCEPTED) {
                throw new ConflictException("Already connected");
            }
            if (status == ConnectionStatus.REJECTED) {
                conn.setStatus(ConnectionStatus.PENDING);
                conn.setContext(request.context());
                Connection saved = connectionRepository.save(conn);
                notificationService.createConnectionRequestReceivedNotification(
                    saved.getToUserId(),
                    fromUser.getId(),
                    resolveActorDisplayName(fromUser),
                    saved.getId(),
                    saved.getContext()
                );
                return toResponse(saved);
            }
        }

        var reverse = connectionRepository.findByFromUserIdAndToUserId(toUserId, fromUser.getId());
        if (reverse.isPresent() && reverse.get().getStatus() == ConnectionStatus.PENDING) {
            throw new BadRequestException("Other user has already sent you a request. Accept or reject it first.");
        }
        if (reverse.isPresent() && reverse.get().getStatus() == ConnectionStatus.ACCEPTED) {
            throw new ConflictException("Already connected");
        }

        Connection connection = new Connection();
        connection.setFromUserId(fromUser.getId());
        connection.setToUserId(toUserId);
        connection.setStatus(ConnectionStatus.PENDING);
        connection.setContext(request.context());
        Connection saved = connectionRepository.save(connection);
        notificationService.createConnectionRequestReceivedNotification(
            saved.getToUserId(),
            fromUser.getId(),
            resolveActorDisplayName(fromUser),
            saved.getId(),
            saved.getContext()
        );
        try {
            emailNotificationService.sendConnectionRequestReceived(
                saved.getToUserId(),
                resolveActorDisplayName(fromUser),
                saved.getId()
            );
        } catch (Exception ignored) { }
        return toResponse(saved);
    }

    @Transactional
    public ConnectionResponse accept(UserPrincipal principal, UUID connectionId) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        Connection connection = connectionRepository.findById(connectionId)
            .orElseThrow(() -> new NotFoundException("Connection not found"));
        if (!connection.getToUserId().equals(user.getId())) {
            throw new BadRequestException("Only the recipient can accept this request");
        }
        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new BadRequestException("Request is no longer pending");
        }
        connection.setStatus(ConnectionStatus.ACCEPTED);
        Connection saved = connectionRepository.save(connection);
        notificationService.createConnectionRequestAcceptedNotification(
            saved.getFromUserId(),
            user.getId(),
            resolveActorDisplayName(user),
            saved.getId(),
            saved.getContext()
        );
        try {
            emailNotificationService.sendConnectionAccepted(
                saved.getFromUserId(),
                resolveActorDisplayName(user),
                saved.getId()
            );
        } catch (Exception ignored) { }
        return toResponse(saved);
    }

    @Transactional
    public ConnectionResponse reject(UserPrincipal principal, UUID connectionId) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        Connection connection = connectionRepository.findById(connectionId)
            .orElseThrow(() -> new NotFoundException("Connection not found"));
        if (!connection.getToUserId().equals(user.getId())) {
            throw new BadRequestException("Only the recipient can reject this request");
        }
        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new BadRequestException("Request is no longer pending");
        }
        connection.setStatus(ConnectionStatus.REJECTED);
        Connection saved = connectionRepository.save(connection);
        notificationService.createConnectionRequestRejectedNotification(
            saved.getFromUserId(),
            user.getId(),
            resolveActorDisplayName(user),
            saved.getId(),
            saved.getContext()
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ConnectionResponse> list(UserPrincipal principal, int page, int size) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("updatedAt")));
        Page<Connection> connections = connectionRepository.findByFromUserIdOrToUserIdOrderByUpdatedAtDesc(
            user.getId(), user.getId(), pageable
        );
        return connections.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ConnectionResponse> listPendingReceived(UserPrincipal principal, int page, int size) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));
        Page<Connection> connections = connectionRepository.findByToUserIdAndStatus(
            user.getId(), ConnectionStatus.PENDING, pageable
        );
        return connections.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveConnection(UUID userId1, UUID userId2) {
        return connectionRepository.hasActiveConnection(userId1, userId2);
    }

    @Transactional(readOnly = true)
    public ConnectionStatus getStatusWith(UserPrincipal principal, UUID otherUserId) {
        User user = userRepository.findById(principal.userId())
            .orElseThrow(() -> new NotFoundException("User not found"));
        var accepted = connectionRepository.findAcceptedConnectionBetween(user.getId(), otherUserId);
        if (accepted.isPresent()) {
            return ConnectionStatus.ACCEPTED;
        }
        var fromMe = connectionRepository.findByFromUserIdAndToUserId(user.getId(), otherUserId);
        if (fromMe.isPresent()) {
            return fromMe.get().getStatus();
        }
        var toMe = connectionRepository.findByFromUserIdAndToUserId(otherUserId, user.getId());
        if (toMe.isPresent()) {
            return toMe.get().getStatus();
        }
        return null;
    }

    private ConnectionResponse toResponse(Connection c) {
        return new ConnectionResponse(
            c.getId(),
            c.getFromUserId(),
            c.getToUserId(),
            c.getStatus(),
            c.getContext(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }

    private String resolveActorDisplayName(User user) {
        if (user == null) {
            return "Un utente";
        }
        String fullName = profileRepository.findByUserId(user.getId())
            .map(profile -> profile.getFullName())
            .filter(name -> name != null && !name.isBlank())
            .map(String::trim)
            .orElse(null);
        if (fullName != null) {
            return fullName;
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        return "Un utente";
    }
}
