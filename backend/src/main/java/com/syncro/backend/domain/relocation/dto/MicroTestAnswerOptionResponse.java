package com.syncro.backend.domain.relocation.dto;

import java.util.UUID;

public record MicroTestAnswerOptionResponse(
    UUID optionId,
    String answerText,
    Integer position
) {}
