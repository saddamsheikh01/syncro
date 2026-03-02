-- Birth place coordinates for Swiss Ephemeris (required for Ascendant/houses when birth time is set)
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS birth_latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS birth_longitude DOUBLE PRECISION;

-- Zodiac degrees (0–30 within sign) for Sun, Moon, Ascendant, Venus, Mars
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS sun_degree DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS moon_degree DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS asc_degree DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS venus_degree DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS mars_degree DOUBLE PRECISION;

COMMENT ON COLUMN user_profiles.birth_latitude IS 'Latitude of place of birth for astrology calculation';
COMMENT ON COLUMN user_profiles.birth_longitude IS 'Longitude of place of birth for astrology calculation';
COMMENT ON COLUMN user_profiles.sun_degree IS 'Sun position: degree within zodiac sign (0–30)';
COMMENT ON COLUMN user_profiles.moon_degree IS 'Moon position: degree within zodiac sign (0–30)';
COMMENT ON COLUMN user_profiles.asc_degree IS 'Ascendant: degree within zodiac sign (0–30); null when birth time unknown';
COMMENT ON COLUMN user_profiles.venus_degree IS 'Venus position: degree within zodiac sign (0–30)';
COMMENT ON COLUMN user_profiles.mars_degree IS 'Mars position: degree within zodiac sign (0–30)';
