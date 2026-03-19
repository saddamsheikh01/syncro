-- Sprint 1 catch-up: creates all Sprint 1 tables that V11-V18 defined but may not have been applied.
-- All statements use IF NOT EXISTS / DO $$ guards so this is safe to run even when some tables already exist.

-- ─── V11: Funnel tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expats_funnel_configs (
    id              UUID PRIMARY KEY,
    config_key      VARCHAR(100)    NOT NULL,
    language        VARCHAR(10)     NOT NULL DEFAULT 'en',
    version         INTEGER         NOT NULL DEFAULT 1,
    content         JSONB           NOT NULL,
    feature_flags   JSONB,
    active          BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL,
    updated_at      TIMESTAMPTZ     NOT NULL,
    created_by      UUID            REFERENCES admin_users(id),
    updated_by      UUID            REFERENCES admin_users(id),
    UNIQUE (config_key, language, version)
);

CREATE TABLE IF NOT EXISTS expats_anonymous_sessions (
    id                  UUID PRIMARY KEY,
    session_token       VARCHAR(255)    NOT NULL UNIQUE,
    status              VARCHAR(30)     NOT NULL DEFAULT 'IN_PROGRESS',
    current_step        INTEGER         NOT NULL DEFAULT 1,
    total_steps         INTEGER         NOT NULL DEFAULT 10,
    user_type           VARCHAR(30),
    expires_at          TIMESTAMPTZ     NOT NULL,
    last_seen_at        TIMESTAMPTZ     NOT NULL,
    converted_user_id   UUID            REFERENCES users(id),
    converted_at        TIMESTAMPTZ,
    metadata            JSONB,
    created_at          TIMESTAMPTZ     NOT NULL,
    updated_at          TIMESTAMPTZ     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anon_sessions_expires_at       ON expats_anonymous_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_last_seen        ON expats_anonymous_sessions (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_converted_user   ON expats_anonymous_sessions (converted_user_id);

CREATE TABLE IF NOT EXISTS expats_anonymous_answers (
    id              UUID PRIMARY KEY,
    session_id      UUID            NOT NULL REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE,
    step_number     INTEGER         NOT NULL,
    question_group  VARCHAR(30)     NOT NULL,
    question_key    VARCHAR(50)     NOT NULL,
    answer_value    JSONB           NOT NULL,
    answered_at     TIMESTAMPTZ     NOT NULL,
    version         INTEGER         NOT NULL DEFAULT 1,
    UNIQUE (session_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_anon_answers_session ON expats_anonymous_answers (session_id);

-- ─── V12: Relocation profile tables ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relocation_profiles (
    id                          UUID PRIMARY KEY,
    user_id                     UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_type                   VARCHAR(30)     NOT NULL DEFAULT 'planning_move',
    target_city_id              UUID,
    target_city_name            VARCHAR(255),
    target_country              VARCHAR(100),
    household                   VARCHAR(30)     NOT NULL DEFAULT 'alone',
    has_pets                    BOOLEAN         NOT NULL DEFAULT false,
    children_age_range          VARCHAR(50),
    monthly_budget              DECIMAL(10,2)   NOT NULL DEFAULT 0,
    primary_goal                VARCHAR(50)     NOT NULL DEFAULT 'lifestyle',
    social_priority             VARCHAR(20)     NOT NULL DEFAULT 'medium',
    desired_lifestyle           VARCHAR(30)     NOT NULL DEFAULT 'balanced',
    work_status                 VARCHAR(30)     NOT NULL DEFAULT 'employed',
    is_remote                   BOOLEAN         NOT NULL DEFAULT false,
    priority_problem            VARCHAR(50)     NOT NULL DEFAULT 'housing',
    free_notes                  TEXT,
    completed_steps             INTEGER         NOT NULL DEFAULT 0,
    completion_percent          INTEGER         NOT NULL DEFAULT 0,
    status                      VARCHAR(20)     NOT NULL DEFAULT 'IN_PROGRESS',
    converted_from_session_id   UUID            REFERENCES expats_anonymous_sessions(id),
    created_at                  TIMESTAMPTZ     NOT NULL,
    updated_at                  TIMESTAMPTZ     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relocation_profiles_user ON relocation_profiles (user_id);

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

CREATE INDEX IF NOT EXISTS idx_onboarding_snapshots_user_active ON relocation_onboarding_snapshots (user_id, is_active);

-- ─── V13: City dataset ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relocation_city_dataset (
    id                              UUID PRIMARY KEY,
    city_name                       VARCHAR(255)    NOT NULL,
    city_slug                       VARCHAR(255)    NOT NULL UNIQUE,
    country                         VARCHAR(100)    NOT NULL,
    country_code                    VARCHAR(5)      NOT NULL,
    expat_community_index           DECIMAL(5,2)    NOT NULL,
    social_integration_index        DECIMAL(5,2)    NOT NULL,
    career_opportunity_index        DECIMAL(5,2)    NOT NULL,
    remote_work_ecosystem_index     DECIMAL(5,2)    NOT NULL,
    rent_index                      DECIMAL(5,2)    NOT NULL,
    purchasing_power_index          DECIMAL(5,2)    NOT NULL,
    groceries_index                 DECIMAL(5,2)    NOT NULL,
    restaurant_index                DECIMAL(5,2)    NOT NULL,
    cost_of_living_ex_rent_index    DECIMAL(5,2)    NOT NULL,
    cost_of_living_inc_rent_index   DECIMAL(5,2)    NOT NULL,
    price_to_income_ratio           DECIMAL(8,2)    NOT NULL,
    price_to_rent_city_center_ratio DECIMAL(8,2)    NOT NULL,
    safety_index                    DECIMAL(5,2)    NOT NULL,
    healthcare_index                DECIMAL(5,2)    NOT NULL,
    climate_index                   DECIMAL(5,2)    NOT NULL,
    pollution_index                 DECIMAL(5,2)    NOT NULL,
    traffic_commute_index           DECIMAL(5,2)    NOT NULL,
    apartment_1br_center            DECIMAL(10,2)   NOT NULL,
    apartment_3br_center            DECIMAL(10,2)   NOT NULL,
    cost_single_no_rent             DECIMAL(10,2)   NOT NULL,
    cost_family_no_rent             DECIMAL(10,2)   NOT NULL,
    macro_costo_vita                DECIMAL(5,2),
    macro_mercato_immobiliare       DECIMAL(5,2),
    macro_potere_economico          DECIMAL(5,2),
    macro_qualita_vita              DECIMAL(5,2),
    macro_opportunita_lavorative    DECIMAL(5,2),
    macro_integrazione_sociale      DECIMAL(5,2),
    districts                       JSONB,
    active                          BOOLEAN         NOT NULL DEFAULT true,
    created_at                      TIMESTAMPTZ     NOT NULL,
    updated_at                      TIMESTAMPTZ     NOT NULL,
    created_by                      UUID            REFERENCES admin_users(id),
    updated_by                      UUID            REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_city_dataset_slug   ON relocation_city_dataset (city_slug);
CREATE INDEX IF NOT EXISTS idx_city_dataset_active ON relocation_city_dataset (active);

-- Add FK from relocation_profiles.target_city_id -> relocation_city_dataset (guard with DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_relocation_profiles_target_city'
    ) THEN
        ALTER TABLE relocation_profiles
            ADD CONSTRAINT fk_relocation_profiles_target_city
            FOREIGN KEY (target_city_id) REFERENCES relocation_city_dataset(id);
    END IF;
END
$$;

-- ─── V14: Weight rules + waiting list ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relocation_weight_rules (
    id                  UUID PRIMARY KEY,
    question_key        VARCHAR(50)     NOT NULL,
    answer_value        VARCHAR(50)     NOT NULL,
    weight_adjustments  JSONB           NOT NULL,
    active              BOOLEAN         NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ     NOT NULL,
    updated_at          TIMESTAMPTZ     NOT NULL,
    UNIQUE (question_key, answer_value)
);

CREATE TABLE IF NOT EXISTS relocation_city_waiting_list (
    id          UUID PRIMARY KEY,
    email       VARCHAR(255)    NOT NULL,
    city_name   VARCHAR(255)    NOT NULL,
    user_id     UUID            REFERENCES users(id),
    session_id  UUID            REFERENCES expats_anonymous_sessions(id),
    notified    BOOLEAN         NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_city     ON relocation_city_waiting_list (city_name);
CREATE INDEX IF NOT EXISTS idx_waiting_list_notified ON relocation_city_waiting_list (notified);

-- ─── V15: City scores ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relocation_city_scores (
    id                              UUID PRIMARY KEY,
    user_id                         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_id                     UUID            NOT NULL REFERENCES relocation_onboarding_snapshots(id),
    city_id                         UUID            REFERENCES relocation_city_dataset(id),
    analysis_type                   VARCHAR(30)     NOT NULL,
    score_total                     INTEGER         NOT NULL CHECK (score_total >= 0 AND score_total <= 100),
    compatibility_level             VARCHAR(20)     NOT NULL,
    breakdown                       JSONB           NOT NULL,
    user_weights                    JSONB           NOT NULL,
    user_priority_classification    JSONB,
    radar_values                    JSONB           NOT NULL,
    budget_check                    JSONB,
    integration_breakdown           JSONB,
    insights                        JSONB,
    algorithm_version               VARCHAR(20)     NOT NULL DEFAULT '1.0',
    ranking_position                INTEGER,
    computed_at                     TIMESTAMPTZ     NOT NULL,
    created_at                      TIMESTAMPTZ     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_city_scores_user        ON relocation_city_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_city_scores_user_type   ON relocation_city_scores (user_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_city_scores_computed    ON relocation_city_scores (computed_at);
CREATE INDEX IF NOT EXISTS idx_city_scores_snapshot    ON relocation_city_scores (snapshot_id);

-- ─── V16: Scoring config ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relocation_scoring_config (
    id                              UUID PRIMARY KEY,
    config_key                      VARCHAR(100)    NOT NULL UNIQUE,
    thresholds                      JSONB           NOT NULL,
    budget_margin_thresholds        JSONB           NOT NULL,
    budget_penalty_thresholds       JSONB           NOT NULL,
    lifestyle_multipliers           JSONB           NOT NULL,
    priority_thresholds             JSONB           NOT NULL,
    city_performance_thresholds     JSONB           NOT NULL,
    active                          BOOLEAN         NOT NULL DEFAULT true,
    created_at                      TIMESTAMPTZ     NOT NULL,
    updated_at                      TIMESTAMPTZ     NOT NULL,
    created_by                      UUID            REFERENCES admin_users(id),
    updated_by                      UUID            REFERENCES admin_users(id)
);

INSERT INTO relocation_scoring_config (
    id, config_key,
    thresholds, budget_margin_thresholds, budget_penalty_thresholds,
    lifestyle_multipliers, priority_thresholds, city_performance_thresholds,
    active, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'city_scoring_v1',
    '{"very_strong_fit": 80, "good_fit": 70, "moderate_fit": 60, "weak_fit": 50, "low_fit": 0}'::jsonb,
    '{"sustainable": 400, "tight": 100, "very_tight": 0, "unsustainable": -1}'::jsonb,
    '{"light": -5, "medium": -10, "heavy": -20}'::jsonb,
    '{"essential": 0.90, "balanced": 1.00, "premium": 1.20, "luxury": 1.50}'::jsonb,
    '{"very_high": 0.25, "high": 0.18, "medium": 0.10, "low": 0.05, "very_low": 0}'::jsonb,
    '{"strong": 75, "good": 60, "medium": 45}'::jsonb,
    true, now(), now()
) ON CONFLICT (config_key) DO NOTHING;

-- ─── V17: Weight rules seed ───────────────────────────────────────────────────

INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
-- life_state
(gen_random_uuid(), 'life_state', 'moving',       '{"costo_vita":5,"mercato_immobiliare":10,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'life_state', 'already_here', '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":10,"qualita_vita":10,"opportunita_lavorative":5,"integrazione_sociale":15}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'life_state', 'exploring',    '{"costo_vita":10,"mercato_immobiliare":5,"potere_economico":5,"qualita_vita":10,"opportunita_lavorative":5,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
-- relocation_time
(gen_random_uuid(), 'relocation_time', 'within_3_months',  '{"costo_vita":10,"mercato_immobiliare":15,"potere_economico":0,"qualita_vita":0,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'relocation_time', 'within_6_months',  '{"costo_vita":5,"mercato_immobiliare":10,"potere_economico":0,"qualita_vita":0,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,   true, now(), now()),
(gen_random_uuid(), 'relocation_time', 'within_12_months', '{"costo_vita":0,"mercato_immobiliare":5,"potere_economico":5,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":0}'::jsonb,    true, now(), now()),
(gen_random_uuid(), 'relocation_time', 'not_decided',      '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":5,"qualita_vita":10,"opportunita_lavorative":5,"integrazione_sociale":5}'::jsonb,   true, now(), now()),
-- age_range
(gen_random_uuid(), 'age_range', '18_24', '{"costo_vita":5,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":10,"integrazione_sociale":10}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'age_range', '25_34', '{"costo_vita":5,"mercato_immobiliare":5,"potere_economico":5,"qualita_vita":5,"opportunita_lavorative":10,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'age_range', '35_44', '{"costo_vita":5,"mercato_immobiliare":10,"potere_economico":5,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'age_range', '45_54', '{"costo_vita":0,"mercato_immobiliare":10,"potere_economico":10,"qualita_vita":10,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'age_range', '55_plus','{"costo_vita":0,"mercato_immobiliare":10,"potere_economico":10,"qualita_vita":15,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb, true, now(), now()),
-- relationship
(gen_random_uuid(), 'relationship', 'alone',          '{"costo_vita":10,"mercato_immobiliare":0,"potere_economico":5,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":10}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'relationship', 'with_partner',   '{"costo_vita":5,"mercato_immobiliare":10,"potere_economico":5,"qualita_vita":10,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'relationship', 'with_children',  '{"costo_vita":0,"mercato_immobiliare":15,"potere_economico":5,"qualita_vita":15,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
-- motivation
(gen_random_uuid(), 'motivation', 'career',     '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":5,"qualita_vita":0,"opportunita_lavorative":10,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'motivation', 'lifestyle',  '{"costo_vita":5,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":15,"opportunita_lavorative":0,"integrazione_sociale":10}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'motivation', 'remote',     '{"costo_vita":10,"mercato_immobiliare":5,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'motivation', 'study',      '{"costo_vita":5,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":10}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'motivation', 'family',     '{"costo_vita":0,"mercato_immobiliare":10,"potere_economico":5,"qualita_vita":15,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'motivation', 'reset',      '{"costo_vita":5,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":15,"opportunita_lavorative":0,"integrazione_sociale":10}'::jsonb, true, now(), now()),
-- work_type
(gen_random_uuid(), 'work_type', 'remote',       '{"costo_vita":10,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'work_type', 'local_job',    '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":5,"qualita_vita":0,"opportunita_lavorative":15,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'work_type', 'entrepreneur', '{"costo_vita":5,"mercato_immobiliare":0,"potere_economico":10,"qualita_vita":0,"opportunita_lavorative":10,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'work_type', 'student',      '{"costo_vita":10,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":5,"integrazione_sociale":10}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'work_type', 'not_working',  '{"costo_vita":10,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":10,"opportunita_lavorative":0,"integrazione_sociale":10}'::jsonb, true, now(), now()),
-- need
(gen_random_uuid(), 'need', 'housing',              '{"costo_vita":0,"mercato_immobiliare":20,"potere_economico":0,"qualita_vita":0,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'neighborhood',         '{"costo_vita":0,"mercato_immobiliare":5,"potere_economico":0,"qualita_vita":10,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'cost_of_living',       '{"costo_vita":20,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":0,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'professional_network', '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":5,"qualita_vita":0,"opportunita_lavorative":10,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'friendships',          '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":0,"qualita_vita":5,"opportunita_lavorative":0,"integrazione_sociale":15}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'schools_family',       '{"costo_vita":0,"mercato_immobiliare":10,"potere_economico":0,"qualita_vita":10,"opportunita_lavorative":0,"integrazione_sociale":0}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'bureaucracy',          '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":10,"qualita_vita":5,"opportunita_lavorative":0,"integrazione_sociale":5}'::jsonb,  true, now(), now()),
(gen_random_uuid(), 'need', 'career_opportunities', '{"costo_vita":0,"mercato_immobiliare":0,"potere_economico":10,"qualita_vita":0,"opportunita_lavorative":10,"integrazione_sociale":0}'::jsonb, true, now(), now())
ON CONFLICT (question_key, answer_value) DO NOTHING;

-- ─── V18: City comparison columns on relocation_profiles ─────────────────────

ALTER TABLE relocation_profiles
    ADD COLUMN IF NOT EXISTS current_city_id   UUID,
    ADD COLUMN IF NOT EXISTS current_city_name VARCHAR(255);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_relocation_profiles_current_city'
    ) THEN
        ALTER TABLE relocation_profiles
            ADD CONSTRAINT fk_relocation_profiles_current_city
            FOREIGN KEY (current_city_id) REFERENCES relocation_city_dataset(id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_relocation_profiles_current_city
    ON relocation_profiles (current_city_id);
