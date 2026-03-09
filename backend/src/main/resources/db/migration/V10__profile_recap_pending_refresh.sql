-- Tracks that the user has taken a test and profile recap should be regenerated on next profile visit.
-- Cleared after POST /zyra/profile-recap/regenerate is called so the API is not called on every profile visit.
CREATE TABLE IF NOT EXISTS profile_recap_pending_refresh (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pending_refresh BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profile_recap_pending_refresh IS 'When true, frontend should call regenerate profile recap once on profile page; cleared after regenerate is called';
