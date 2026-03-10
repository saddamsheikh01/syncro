-- Sprint 1: Relocation profile + onboarding snapshots

-- 4. Relocation profiles (registered user onboarding data, separate from base profile)
CREATE TABLE IF NOT EXISTS relocation_profiles (
    id                          UUID PRIMARY KEY,
    user_id                     UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_type                   VARCHAR(30)     NOT NULL,
    target_city_id              UUID,
    target_city_name            VARCHAR(255),
    target_country              VARCHAR(100),
    household                   VARCHAR(30)     NOT NULL,
    has_pets                    BOOLEAN         NOT NULL DEFAULT false,
    children_age_range          VARCHAR(50),
    monthly_budget              DECIMAL(10,2)   NOT NULL,
    primary_goal                VARCHAR(50)     NOT NULL,
    social_priority             VARCHAR(20)     NOT NULL,
    desired_lifestyle           VARCHAR(30)     NOT NULL,
    work_status                 VARCHAR(30)     NOT NULL,
    is_remote                   BOOLEAN         NOT NULL DEFAULT false,
    priority_problem            VARCHAR(50)     NOT NULL,
    free_notes                  TEXT,
    completed_steps             INTEGER         NOT NULL DEFAULT 0,
    completion_percent          INTEGER         NOT NULL DEFAULT 0,
    status                      VARCHAR(20)     NOT NULL DEFAULT 'IN_PROGRESS',
    converted_from_session_id   UUID            REFERENCES expats_anonymous_sessions(id),
    created_at                  TIMESTAMPTZ     NOT NULL,
    updated_at                  TIMESTAMPTZ     NOT NULL
);

COMMENT ON TABLE relocation_profiles IS 'Relocation-specific profile per registered user; separate from user_profiles base profile';
COMMENT ON COLUMN relocation_profiles.user_type IS 'planning_move, chosen_city, already_in_city';
COMMENT ON COLUMN relocation_profiles.target_city_id IS 'FK to relocation_city_dataset, added via ALTER in V13; nullable for planning_move';
COMMENT ON COLUMN relocation_profiles.household IS 'alone, with_partner, with_children';
COMMENT ON COLUMN relocation_profiles.primary_goal IS 'career_growth, remote_work, study, lifestyle, family_stability, personal_reset';
COMMENT ON COLUMN relocation_profiles.desired_lifestyle IS 'essential, balanced, comfort, experience';
COMMENT ON COLUMN relocation_profiles.work_status IS 'employed, freelancer, entrepreneur, student, not_working';
COMMENT ON COLUMN relocation_profiles.priority_problem IS 'housing, neighborhood, cost_of_living, professional_network, friendships, schools_family, bureaucracy, career_opportunities';
COMMENT ON COLUMN relocation_profiles.status IS 'IN_PROGRESS, COMPLETED';

CREATE INDEX IF NOT EXISTS idx_relocation_profiles_user ON relocation_profiles (user_id);

-- 5. Onboarding snapshots (immutable versioned copies for scoring)
CREATE TABLE IF NOT EXISTS relocation_onboarding_snapshots (
    id                      UUID PRIMARY KEY,
    user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relocation_profile_id   UUID            NOT NULL REFERENCES relocation_profiles(id) ON DELETE CASCADE,
    version                 INTEGER         NOT NULL DEFAULT 1,
    payload                 JSONB           NOT NULL,
    is_active               BOOLEAN         NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ     NOT NULL,
    UNIQUE (user_id, version)
);

COMMENT ON TABLE relocation_onboarding_snapshots IS 'Immutable snapshot of onboarding state at scoring time; is_active marks the latest';
COMMENT ON COLUMN relocation_onboarding_snapshots.payload IS 'Complete immutable copy of onboarding data at compute time';

CREATE INDEX IF NOT EXISTS idx_onboarding_snapshots_user_active ON relocation_onboarding_snapshots (user_id, is_active);
