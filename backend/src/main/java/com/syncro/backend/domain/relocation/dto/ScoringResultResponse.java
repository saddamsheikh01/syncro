package com.syncro.backend.domain.relocation.dto;

import java.util.List;
import java.util.UUID;

public record ScoringResultResponse(
        UUID snapshotId,
        String analysisType,
        String userType,
        List<CityScoreResponse> scores,
        String algorithmVersion
) {}
