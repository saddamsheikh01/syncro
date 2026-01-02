package com.syncro.backend.domain.social.controller;

import com.syncro.backend.domain.social.dto.ChatConversationResponse;
import com.syncro.backend.domain.social.dto.ChatMessageRequest;
import com.syncro.backend.domain.social.dto.ChatMessageResponse;
import com.syncro.backend.domain.social.dto.CreateConversationRequest;
import com.syncro.backend.domain.social.service.ChatService;
import com.syncro.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chats")
@Tag(name = "Chats", description = "Chat private")
@SecurityRequirement(name = "bearer-jwt")
public class ChatsController {

    private final ChatService chatService;

    public ChatsController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    @Operation(summary = "Lista conversazioni")
    public ResponseEntity<Page<ChatConversationResponse>> getConversations(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(chatService.getConversations(principal, page, size));
    }

    @PostMapping
    @Operation(summary = "Crea conversazione")
    public ResponseEntity<ChatConversationResponse> createConversation(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateConversationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(chatService.createConversation(principal, request));
    }

    @GetMapping("/{conversationId}/messages")
    @Operation(summary = "Lista messaggi")
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID conversationId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(chatService.getMessages(principal, conversationId, page, size));
    }

    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Invia messaggio")
    public ResponseEntity<ChatMessageResponse> sendMessage(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID conversationId,
        @Valid @RequestBody ChatMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(chatService.sendMessage(principal, conversationId, request));
    }
}
