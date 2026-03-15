-- Viator experience cache: for a given cache_key (includes locale), stores experience IDs from last successful fetch.
CREATE TABLE IF NOT EXISTS viator_experience_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(512) NOT NULL,
    cache_type VARCHAR(32) NOT NULL,
    locale VARCHAR(16) NOT NULL,
    experience_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_viator_experience_cache_key
    ON viator_experience_cache (cache_key);

CREATE INDEX IF NOT EXISTS idx_viator_experience_cache_expires
    ON viator_experience_cache (expires_at);

COMMENT ON TABLE viator_experience_cache IS 'Cache of Viator experience list per (key+locale); key includes locale.';

-- Viator fetch job: DB-backed queue for background fetch (nearby or search). One active job per cache_key.
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

CREATE INDEX IF NOT EXISTS idx_viator_fetch_job_status_pending
    ON viator_fetch_job (created_at)
    WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_viator_fetch_job_cache_key_status
    ON viator_fetch_job (cache_key, status);

COMMENT ON TABLE viator_fetch_job IS 'Background jobs for Viator nearby/search fetch; one PENDING/RUNNING per cache_key.';
