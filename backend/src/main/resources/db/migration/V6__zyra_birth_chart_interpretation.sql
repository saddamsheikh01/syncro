-- Cache Zyra AI interpretation of the user's birth chart. Generated once on calculate-and-save; reused until chart data (DOB, time, place) changes.
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS zyra_birth_chart_interpretation TEXT;

COMMENT ON COLUMN user_profiles.zyra_birth_chart_interpretation IS 'Cached Zyra AI interpretation of birth chart; regenerated only when chart is recalculated';
