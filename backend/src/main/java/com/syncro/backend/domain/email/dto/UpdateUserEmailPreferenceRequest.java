package com.syncro.backend.domain.email.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Optional;

public record UpdateUserEmailPreferenceRequest(
    Optional<Boolean> chatEnabled,
    Optional<Boolean> connectionsEnabled,
    Optional<Boolean> matchEnabled,
    Optional<Boolean> eventsEnabled,
    Optional<Boolean> digestEnabled,
    Optional<Boolean> contentWeeklyDigest,
    @Min(1) @Max(1440) Optional<Integer> chatMinMinutesBetween,
    Optional<Boolean> securityEnabled,
    Optional<Boolean> testsProfileEnabled,
    Optional<Boolean> feedMomentsEnabled
) {}
