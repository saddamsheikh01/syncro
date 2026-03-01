package com.syncro.backend.domain.email.dto;

import java.util.Optional;

public record UpdateUserEmailPreferenceRequest(
    Optional<Boolean> chatEnabled,
    Optional<Boolean> connectionsEnabled,
    Optional<Boolean> matchEnabled,
    Optional<Boolean> eventsEnabled,
    Optional<Boolean> digestEnabled,
    Optional<Boolean> contentWeeklyDigest,
    Optional<Integer> chatMinMinutesBetween,
    Optional<Boolean> securityEnabled,
    Optional<Boolean> testsProfileEnabled,
    Optional<Boolean> feedMomentsEnabled
) {}
