-- Track last activity for NEW_MESSAGE_OFFLINE: only email when user inactive >= chatMinMinutesBetween
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_active_at IS 'Last time user was active (ping, chat, etc). Used to decide if NEW_MESSAGE_OFFLINE email should be sent.';
