-- Store last login device and country for security email (new login from different device/country).
-- Run this SQL against your DB when ready; then re-add lastLoginDevice/lastLoginCountry to User entity
-- and the recordLoginDeviceCountry logic in AuthService (see git history) to enable the feature.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_device VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_login_country VARCHAR(128);

COMMENT ON COLUMN users.last_login_device IS 'Last login user-agent or device description';
COMMENT ON COLUMN users.last_login_country IS 'Last login country or IP for comparison';
