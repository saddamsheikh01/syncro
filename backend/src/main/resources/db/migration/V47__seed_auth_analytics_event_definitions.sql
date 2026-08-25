INSERT INTO analytics_event_definitions (event_name, event_version, description, payload_required_keys, is_active)
VALUES
    ('USER_REGISTERED', 1, 'User registered', ARRAY[]::text[], TRUE),
    ('LOGIN_SUCCESS', 1, 'User login succeeded', ARRAY[]::text[], TRUE),
    ('LOGIN_FAILED', 1, 'User login failed', ARRAY[]::text[], TRUE),
    ('LOGIN_REQUIRES_VERIFICATION', 1, 'Login requires email verification', ARRAY[]::text[], TRUE),
    ('PASSWORD_RESET_REQUESTED', 1, 'Password reset requested', ARRAY[]::text[], TRUE),
    ('PASSWORD_RESET_COMPLETED', 1, 'Password reset completed', ARRAY[]::text[], TRUE),
    ('ONBOARDING_COMPLETED', 1, 'Onboarding completed', ARRAY[]::text[], TRUE)
ON CONFLICT (event_name, event_version) DO UPDATE
SET description = EXCLUDED.description,
    payload_required_keys = EXCLUDED.payload_required_keys,
    is_active = EXCLUDED.is_active;
