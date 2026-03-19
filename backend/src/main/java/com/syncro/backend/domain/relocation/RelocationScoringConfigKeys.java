package com.syncro.backend.domain.relocation;

/**
 * Must match {@code relocation_scoring_config.config_key} seeded in Flyway (e.g. V17).
 */
public final class RelocationScoringConfigKeys {

    public static final String ACTIVE = "city_scoring_v1";

    private RelocationScoringConfigKeys() {}
}
