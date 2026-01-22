package com.syncro.backend.domain.zyra.dto;

import java.time.Instant;
import java.util.List;

public record ZyraChatRecapResponse(
    String recap,
    int conversationCount,
    List<String> recentContacts,
    Instant generatedAt
) {
}
