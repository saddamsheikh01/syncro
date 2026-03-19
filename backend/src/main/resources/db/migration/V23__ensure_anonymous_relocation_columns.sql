-- Ensure V21 anonymous WOW columns exist (idempotent; fixes DBs where V21 was repaired but not re-applied)

-- relocation_city_scores
ALTER TABLE relocation_city_scores ADD COLUMN IF NOT EXISTS anonymous_session_id UUID
    REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE;
ALTER TABLE relocation_city_scores ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE relocation_city_scores DROP CONSTRAINT IF EXISTS relocation_city_scores_owner_chk;
ALTER TABLE relocation_city_scores ADD CONSTRAINT relocation_city_scores_owner_chk CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_relocation_city_scores_anon ON relocation_city_scores(anonymous_session_id);
