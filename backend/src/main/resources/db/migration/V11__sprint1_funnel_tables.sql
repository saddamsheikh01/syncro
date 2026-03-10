-- Sprint 1: Funnel Expats tables (anonymous sessions, answers, config)

-- 1. Funnel configuration (dynamic content, CTA, feature flags, versioning)
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

COMMENT ON TABLE expats_funnel_configs IS 'Dynamic funnel configuration: CTA texts, question labels, feature flags, per language and version';

-- 2. Anonymous sessions (funnel state tracking)
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

COMMENT ON TABLE expats_anonymous_sessions IS 'Anonymous funnel sessions: tracks step progress, expiry, and eventual conversion to registered user';
COMMENT ON COLUMN expats_anonymous_sessions.status IS 'IN_PROGRESS, COMPLETED, CONVERTED, EXPIRED';
COMMENT ON COLUMN expats_anonymous_sessions.user_type IS 'planning_move, chosen_city, already_in_city — known after step 1';
COMMENT ON COLUMN expats_anonymous_sessions.metadata IS 'Device info, user agent, referrer';

CREATE INDEX IF NOT EXISTS idx_anon_sessions_expires_at ON expats_anonymous_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_last_seen ON expats_anonymous_sessions (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_anon_sessions_converted_user ON expats_anonymous_sessions (converted_user_id);

-- 3. Anonymous answers (step-based onboarding responses)
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

COMMENT ON TABLE expats_anonymous_answers IS 'Per-step anonymous answers linked to session; version tracks re-answers on back-navigation';
COMMENT ON COLUMN expats_anonymous_answers.question_group IS 'CITY_FIT, POSITIONING, EXECUTION';
COMMENT ON COLUMN expats_anonymous_answers.question_key IS 'user_phase, target_city, household, children_age_range, has_pets, monthly_budget, primary_goal, social_priority, desired_lifestyle, work_status, is_remote, priority_problem, free_notes';

CREATE INDEX IF NOT EXISTS idx_anon_answers_session ON expats_anonymous_answers (session_id);
