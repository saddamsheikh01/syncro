package com.syncro.backend.domain.zyra.dto;

public record ZyraChatResponse(
    ZyraMessageResponse userMessage,
    ZyraMessageResponse assistantMessage
) {
}
