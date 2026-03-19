-- Ensure V21 anonymous columns on relocation_profiles and relocation_onboarding_snapshots (idempotent)

-- 1. relocation_profiles
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

-- 2. relocation_onboarding_snapshots
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
