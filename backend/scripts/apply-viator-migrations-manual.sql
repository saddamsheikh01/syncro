-- Run this script if the app fails with "missing column [locale] in table [experiences]".
-- Your app uses schema syncro_dev (from currentSchema=syncro_dev). Run this with that schema:
--
--   Option A - psql (set schema first):
--     psql -h localhost -p 5432 -U your_user -d syncro_db
--     SET search_path TO syncro_dev;
--     \i backend/scripts/apply-viator-migrations-manual.sql
--
--   Option B - From any client: connect to syncro_db, set default schema to syncro_dev, then run the statements below.

-- 1) V11: Viator cache and job tables (skip if Flyway already created them)
CREATE TABLE IF NOT EXISTS viator_experience_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(512) NOT NULL,
    cache_type VARCHAR(32) NOT NULL,
    locale VARCHAR(16) NOT NULL,
    experience_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_viator_experience_cache_key ON viator_experience_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_viator_experience_cache_expires ON viator_experience_cache (expires_at);

CREATE TABLE IF NOT EXISTS viator_fetch_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(512) NOT NULL,
    job_type VARCHAR(32) NOT NULL,
    locale VARCHAR(16) NOT NULL,
    params JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_viator_fetch_job_status_pending ON viator_fetch_job (created_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_viator_fetch_job_cache_key_status ON viator_fetch_job (cache_key, status);

-- 2) V12: Add locale to experiences (fixes "missing column [locale]")
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS locale VARCHAR(16);
COMMENT ON COLUMN experiences.locale IS 'Content language (e.g. en, it). For Viator: upsert by (provider, external_id, locale).';
CREATE UNIQUE INDEX IF NOT EXISTS idx_experiences_viator_provider_external_locale
    ON experiences (provider, external_id, locale)
    WHERE provider IS NOT NULL AND external_id IS NOT NULL AND locale IS NOT NULL;
