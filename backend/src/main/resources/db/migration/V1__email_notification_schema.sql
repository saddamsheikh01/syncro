-- Email notification preferences and sent log for rate limiting / digest
-- Run this migration if your schema is managed manually (e.g. ddl-auto: validate).

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
    reference_id UUID,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_email_sent_log_user_sent ON email_sent_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sent_log_user_type_sent ON email_sent_log(user_id, email_type, sent_at DESC);

COMMENT ON TABLE user_email_preferences IS 'Per-user toggles for email notifications and digest/rate limit settings';
COMMENT ON TABLE email_sent_log IS 'Log of sent emails for rate limiting (e.g. max 1 chat email per X min) and digest logic';
