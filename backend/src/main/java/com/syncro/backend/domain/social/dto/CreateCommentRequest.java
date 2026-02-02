package com.syncro.backend.domain.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
    @NotBlank(message = "Il commento non può essere vuoto")
    @Size(max = 100, message = "Il commento non può superare i 100 caratteri")
    String content
) {
}
