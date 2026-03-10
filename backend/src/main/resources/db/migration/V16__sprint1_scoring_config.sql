-- Sprint 1: Scoring configuration (thresholds and interpretive parameters, NOT calculation weights)

-- 8. Scoring config (admin-editable thresholds; calculation weights come from user answers)
CREATE TABLE IF NOT EXISTS relocation_scoring_config (
    id                              UUID PRIMARY KEY,
    config_key                      VARCHAR(100)    NOT NULL UNIQUE,
    thresholds                      JSONB           NOT NULL,
    budget_margin_thresholds        JSONB           NOT NULL,
    budget_penalty_thresholds       JSONB           NOT NULL,
    lifestyle_multipliers           JSONB           NOT NULL,
    priority_thresholds             JSONB           NOT NULL,
    city_performance_thresholds     JSONB           NOT NULL,
    active                          BOOLEAN         NOT NULL DEFAULT true,
    created_at                      TIMESTAMPTZ     NOT NULL,
    updated_at                      TIMESTAMPTZ     NOT NULL,
    created_by                      UUID            REFERENCES admin_users(id),
    updated_by                      UUID            REFERENCES admin_users(id)
);

COMMENT ON TABLE relocation_scoring_config IS 'Interpretive thresholds for scoring engine; City Fit Score weights derive from user answers, not from here';
COMMENT ON COLUMN relocation_scoring_config.thresholds IS '5 compatibility levels: {very_strong_fit: 80, good_fit: 70, moderate_fit: 60, weak_fit: 50, low_fit: 0}';
COMMENT ON COLUMN relocation_scoring_config.budget_margin_thresholds IS 'EUR margin thresholds: {sustainable: 400, tight: 100, very_tight: 0, unsustainable: -1}';
COMMENT ON COLUMN relocation_scoring_config.budget_penalty_thresholds IS 'Score penalties: {light: -5, medium: -10, heavy: -20}';
COMMENT ON COLUMN relocation_scoring_config.lifestyle_multipliers IS 'Budget conversion: {essential: 0.90, balanced: 1.00, premium: 1.20, luxury: 1.50}';
COMMENT ON COLUMN relocation_scoring_config.priority_thresholds IS 'User priority classification: {very_high: 0.25, high: 0.18, medium: 0.10, low: 0.05, very_low: 0}';
COMMENT ON COLUMN relocation_scoring_config.city_performance_thresholds IS 'City performance levels: {strong: 75, good: 60, medium: 45} — below 45 is WEAK';

-- Insert sensible defaults (engine works without manual configuration)
INSERT INTO relocation_scoring_config (
    id, config_key,
    thresholds,
    budget_margin_thresholds,
    budget_penalty_thresholds,
    lifestyle_multipliers,
    priority_thresholds,
    city_performance_thresholds,
    active, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'city_scoring_v1',
    '{"very_strong_fit": 80, "good_fit": 70, "moderate_fit": 60, "weak_fit": 50, "low_fit": 0}'::jsonb,
    '{"sustainable": 400, "tight": 100, "very_tight": 0, "unsustainable": -1}'::jsonb,
    '{"light": -5, "medium": -10, "heavy": -20}'::jsonb,
    '{"essential": 0.90, "balanced": 1.00, "premium": 1.20, "luxury": 1.50}'::jsonb,
    '{"very_high": 0.25, "high": 0.18, "medium": 0.10, "low": 0.05, "very_low": 0}'::jsonb,
    '{"strong": 75, "good": 60, "medium": 45}'::jsonb,
    true,
    now(),
    now()
);
