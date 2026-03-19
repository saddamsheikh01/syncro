-- WOW page: relocation APIs for anonymous expat sessions (session token, no JWT)

-- 1. relocation_profiles: owned by user OR by anonymous session
ALTER TABLE relocation_profiles DROP CONSTRAINT IF EXISTS relocation_profiles_user_id_key;
ALTER TABLE relocation_profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE relocation_profiles ADD COLUMN IF NOT EXISTS anonymous_session_id UUID
    REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_relocation_profiles_user_id_nn
    ON relocation_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_relocation_profiles_anon_session
    ON relocation_profiles(anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

ALTER TABLE relocation_profiles DROP CONSTRAINT IF EXISTS relocation_profiles_owner_chk;
ALTER TABLE relocation_profiles ADD CONSTRAINT relocation_profiles_owner_chk CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

-- 2. Snapshots: user OR anonymous session
ALTER TABLE relocation_onboarding_snapshots DROP CONSTRAINT IF EXISTS relocation_onboarding_snapshots_user_id_version_key;
ALTER TABLE relocation_onboarding_snapshots ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE relocation_onboarding_snapshots ADD COLUMN IF NOT EXISTS anonymous_session_id UUID
    REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_snapshots_user_version
    ON relocation_onboarding_snapshots(user_id, version) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_snapshots_anon_version
    ON relocation_onboarding_snapshots(anonymous_session_id, version) WHERE anonymous_session_id IS NOT NULL;

ALTER TABLE relocation_onboarding_snapshots DROP CONSTRAINT IF EXISTS relocation_onboarding_snapshots_owner_chk;
ALTER TABLE relocation_onboarding_snapshots ADD CONSTRAINT relocation_onboarding_snapshots_owner_chk CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_snapshots_anon_active
    ON relocation_onboarding_snapshots(anonymous_session_id, is_active);

-- 3. City scores: user OR anonymous session
ALTER TABLE relocation_city_scores ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE relocation_city_scores ADD COLUMN IF NOT EXISTS anonymous_session_id UUID
    REFERENCES expats_anonymous_sessions(id) ON DELETE CASCADE;

ALTER TABLE relocation_city_scores DROP CONSTRAINT IF EXISTS relocation_city_scores_owner_chk;
ALTER TABLE relocation_city_scores ADD CONSTRAINT relocation_city_scores_owner_chk CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_relocation_city_scores_anon ON relocation_city_scores(anonymous_session_id);
