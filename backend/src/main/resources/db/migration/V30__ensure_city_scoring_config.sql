-- Ensure active scoring config exists (fixes envs where V17 row was missing)
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
) ON CONFLICT (config_key) DO NOTHING;
