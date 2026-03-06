-- Store short highlights (one per test) for profile recap snapshot; JSON array of strings.
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS zyra_recap_highlights TEXT;

COMMENT ON COLUMN user_profiles.zyra_recap_highlights IS 'JSON array of short Zyra insights, one per test (values, objectives, psychological, lifestyle, interests, birth chart)';
