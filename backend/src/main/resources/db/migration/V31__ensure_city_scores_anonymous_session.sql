-- Add anonymous_session_id to relocation_city_scores (mirrors V29 pattern for profiles/snapshots)
-- Required for anonymous expat scoring (WOW page before registration)

ALTER TABLE relocation_city_scores ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE relocation_city_scores ADD COLUMN IF NOT EXISTS anonymous_session_id UUID
    REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_city_scores_anon_session
    ON relocation_city_scores(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_city_scores_anon_snapshot
    ON relocation_city_scores(anonymous_session_id, snapshot_id);
