package com.syncro.backend.domain.email.dto;

import java.util.UUID;

public record UserEmailPreferenceResponse(
    UUID userId,
    boolean chatEnabled,
    boolean connectionsEnabled,
    boolean matchEnabled,
    boolean eventsEnabled,
    boolean digestEnabled,
    boolean contentWeeklyDigest,
    int chatMinMinutesBetween,
    boolean securityEnabled,
    boolean testsProfileEnabled,
    boolean feedMomentsEnabled
) {}
