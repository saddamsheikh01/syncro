package com.syncro.backend.domain.relocation.dto;

import java.util.List;
import java.util.UUID;

public record MicroTestQuestionResponse(
    UUID questionId,
    String questionText,
    String questionType,
    Integer position,
    List<MicroTestAnswerOptionResponse> options
) {}
