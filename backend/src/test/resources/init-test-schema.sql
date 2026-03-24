-- ==============================================
-- Integration Test Baseline Schema
-- ==============================================
-- Creates schema + all tables that exist BEFORE Flyway V9.
-- (baseline-version=8 means V1-V8 are skipped, so we must create
--  the base tables AND the V1-V8 tables/columns here.)
-- Flyway will then run V9, V10, V11-V17 against this schema.

CREATE SCHEMA IF NOT EXISTS syncro_test;
SET search_path TO syncro_test;

-- ===== BASE TABLE: users (pre-Flyway, includes V2/V3/V4 columns) =====
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    username VARCHAR(255),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_device VARCHAR(255),
    last_login_country VARCHAR(128),
    last_active_at TIMESTAMPTZ
);

-- ===== BASE TABLE: admin_users (pre-Flyway) =====
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== BASE TABLE: user_profiles (pre-Flyway, includes V5/V6/V9 columns) =====
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    birth_date DATE,
    city VARCHAR(100),
    country VARCHAR(100),
    gender VARCHAR(50),
    zodiac_sign VARCHAR(50),
    sun_sign VARCHAR(50),
    moon_sign VARCHAR(50),
    asc_sign VARCHAR(50),
    venus_sign VARCHAR(50),
    mars_sign VARCHAR(50),
    birth_place VARCHAR(255),
    birth_latitude DOUBLE PRECISION,
    birth_longitude DOUBLE PRECISION,
    birth_time TIME,
    sun_degree DOUBLE PRECISION,
    moon_degree DOUBLE PRECISION,
    asc_degree DOUBLE PRECISION,
    venus_degree DOUBLE PRECISION,
    mars_degree DOUBLE PRECISION,
    job_title VARCHAR(120),
    company_name VARCHAR(160),
    bio VARCHAR(500),
    traits_text VARCHAR(500),
    loves_text VARCHAR(500),
    dislikes_text VARCHAR(500),
    goals_text VARCHAR(500),
    values_text VARCHAR(500),
    zyra_recap TEXT,
    zyra_recap_highlights TEXT,
    zyra_birth_chart_interpretation TEXT,
    relationship_status VARCHAR(50),
    orientation VARCHAR(50),
    children_status VARCHAR(50),
    visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== BASE TABLE: user_preferences =====
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    matchmaking_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    feed_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
    privacy_policy_accepted_at TIMESTAMPTZ,
    newsletter_consent BOOLEAN NOT NULL DEFAULT false,
    newsletter_consent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== V1: email_notification_schema =====
CREATE TABLE IF NOT EXISTS user_email_preferences (
    user_id UUID NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_enabled BOOLEAN NOT NULL DEFAULT true,
    connections_enabled BOOLEAN NOT NULL DEFAULT true,
    match_enabled BOOLEAN NOT NULL DEFAULT true,
    events_enabled BOOLEAN NOT NULL DEFAULT true,
    digest_enabled BOOLEAN NOT NULL DEFAULT true,
    content_weekly_digest BOOLEAN NOT NULL DEFAULT true,
    chat_min_minutes_between INTEGER NOT NULL DEFAULT 15,
    security_enabled BOOLEAN NOT NULL DEFAULT true,
    tests_profile_enabled BOOLEAN NOT NULL DEFAULT true,
    feed_moments_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type VARCHAR(64) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_id UUID
);

-- ===== V4: email_verification_otp (includes V7 column) =====
CREATE TABLE IF NOT EXISTS email_verification_otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    target_email_hash VARCHAR(64) NULL
);

-- ===== V8: viator_destination_refs =====
CREATE TABLE IF NOT EXISTS viator_destination_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_ref VARCHAR(255) NOT NULL,
    city_name VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== BASE TABLE: experiences (pre-Flyway, referenced by V12/V13/V15) =====
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID,
    source TEXT NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    place_id UUID,
    provider TEXT,
    external_id TEXT,
    price NUMERIC,
    price_currency TEXT DEFAULT 'EUR',
    original_price NUMERIC,
    duration_minutes INTEGER,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    booking_url TEXT,
    rating NUMERIC,
    review_count INTEGER DEFAULT 0,
    latitude NUMERIC,
    longitude NUMERIC,
    location_name TEXT,
    highlights JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    cancellation_policy TEXT,
    meeting_point TEXT,
    min_participants INTEGER,
    max_participants INTEGER,
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ===== BASE TABLE: experiences (pre-Flyway, referenced by V12/V13/V15) =====
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID,
    source TEXT NOT NULL DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    place_id UUID,
    provider TEXT,
    external_id TEXT,
    price NUMERIC,
    price_currency TEXT DEFAULT 'EUR',
    original_price NUMERIC,
    duration_minutes INTEGER,
    image_url TEXT,
    images JSONB DEFAULT '[]',
    booking_url TEXT,
    rating NUMERIC,
    review_count INTEGER DEFAULT 0,
    latitude NUMERIC,
    longitude NUMERIC,
    location_name TEXT,
    highlights JSONB DEFAULT '[]',
    inclusions JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    cancellation_policy TEXT,
    meeting_point TEXT,
    min_participants INTEGER,
    max_participants INTEGER,
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ===== ANALYTICS TABLES (pre-Flyway, referenced by AnalyticsService) =====
-- Needed because Sprint 1 services call trackServerEventSafe() which queries these tables.
-- Without them, the SQL failure poisons the enclosing transaction.

CREATE TABLE IF NOT EXISTS analytics_event_definitions (
    event_name VARCHAR(255) NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    payload_required_keys TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_name, event_version)
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds NUMERIC,
    platform VARCHAR(255),
    app_version VARCHAR(255),
    route_start VARCHAR(255),
    route_end VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    session_id UUID,
    idempotency_key VARCHAR(255),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    route VARCHAR(255),
    platform VARCHAR(255),
    app_version VARCHAR(255),
    event_source VARCHAR(255) NOT NULL DEFAULT 'web',
    consent_analytics BOOLEAN NOT NULL DEFAULT true,
    user_agent TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_daily_kpi (
    metric_date DATE NOT NULL,
    kpi_name VARCHAR(255) NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (metric_date, kpi_name)
);

CREATE TABLE IF NOT EXISTS analytics_ingestion_errors (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,
    idempotency_key VARCHAR(255),
    raw_event JSONB NOT NULL DEFAULT '{}',
    error_code VARCHAR(255) NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT ''
);

-- ===== TEST DOMAIN TABLES (pre-Flyway, referenced by Sprint 2 migrations) =====

CREATE TABLE IF NOT EXISTS test_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    test_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    scoring_strategy VARCHAR(50) NOT NULL DEFAULT 'SINGLE_SCORE',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_definition_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'SINGLE_CHOICE',
    position INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_answer_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    score_value INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES test_definitions(id),
    score_payload JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_test_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES user_test_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES test_questions(id),
    answer_option_id UUID NOT NULL REFERENCES test_answer_options(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_psy_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile JSONB NOT NULL DEFAULT '{}',
    interests_score INTEGER,
    lifestyle_score INTEGER,
    values_score INTEGER,
    objectives_score INTEGER,
    psy_score INTEGER,
    astro_score INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_definition_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_definition_id UUID NOT NULL REFERENCES test_definitions(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_definition_id, language)
);

CREATE TABLE IF NOT EXISTS test_question_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    question_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(question_id, language)
);

CREATE TABLE IF NOT EXISTS test_answer_option_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_option_id UUID NOT NULL REFERENCES test_answer_options(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(answer_option_id, language)
);
