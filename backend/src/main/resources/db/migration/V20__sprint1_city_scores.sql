-- Sprint 1: City scoring results (Level C output)

-- 7. City scores (Level C: user output from macroaree * user weights)
CREATE TABLE IF NOT EXISTS relocation_city_scores (
    id                              UUID PRIMARY KEY,
    user_id                         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_id                     UUID            NOT NULL REFERENCES relocation_onboarding_snapshots(id),
    city_id                         UUID            REFERENCES relocation_city_dataset(id),
    analysis_type                   VARCHAR(30)     NOT NULL,
    score_total                     INTEGER         NOT NULL CHECK (score_total >= 0 AND score_total <= 100),
    compatibility_level             VARCHAR(20)     NOT NULL,
    breakdown                       JSONB           NOT NULL,
    user_weights                    JSONB           NOT NULL,
    user_priority_classification    JSONB,
    radar_values                    JSONB           NOT NULL,
    budget_check                    JSONB,
    integration_breakdown           JSONB,
    insights                        JSONB,
    algorithm_version               VARCHAR(20)     NOT NULL DEFAULT '1.0',
    ranking_position                INTEGER,
    computed_at                     TIMESTAMPTZ     NOT NULL,
    created_at                      TIMESTAMPTZ     NOT NULL
);

COMMENT ON TABLE relocation_city_scores IS 'City scoring output: City Fit Score, macroaree breakdown, user weights, budget check, insights';
COMMENT ON COLUMN relocation_city_scores.analysis_type IS 'CITY_RANKING, CHOSEN_CITY_ANALYSIS, INTEGRATION_ANALYSIS';
COMMENT ON COLUMN relocation_city_scores.compatibility_level IS 'VERY_STRONG_FIT (>=80), GOOD_FIT (>=70), MODERATE_FIT (>=60), WEAK_FIT (>=50), LOW_FIT (<50)';
COMMENT ON COLUMN relocation_city_scores.breakdown IS '6 macroaree scores: {costo_vita, mercato_immobiliare, potere_economico, qualita_vita, opportunita_lavorative, integrazione_sociale}';
COMMENT ON COLUMN relocation_city_scores.user_weights IS 'Normalized user weights: {costo_vita: 0.17, ...} derived from onboarding answers';
COMMENT ON COLUMN relocation_city_scores.user_priority_classification IS 'Priority per macroarea: {costo_vita: "MEDIUM", qualita_vita: "VERY_HIGH", ...}';
COMMENT ON COLUMN relocation_city_scores.radar_values IS 'Mapped 1:1 to 6 macroaree for frontend radar chart';
COMMENT ON COLUMN relocation_city_scores.budget_check IS '{estimated_city_cost, user_budget_adjusted, margin, margin_status, lifestyle_multiplier, suggestions[]}';
COMMENT ON COLUMN relocation_city_scores.integration_breakdown IS 'Only for INTEGRATION_ANALYSIS: {housing_stability, social_integration, professional_network, cost_sustainability}';
COMMENT ON COLUMN relocation_city_scores.insights IS '3 rule-based insights: 2 strengths + 1 friction point';
COMMENT ON COLUMN relocation_city_scores.ranking_position IS 'Only for CITY_RANKING analysis type';

CREATE INDEX IF NOT EXISTS idx_city_scores_user ON relocation_city_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_city_scores_user_type ON relocation_city_scores (user_id, analysis_type);
CREATE INDEX IF NOT EXISTS idx_city_scores_computed ON relocation_city_scores (computed_at);
CREATE INDEX IF NOT EXISTS idx_city_scores_snapshot ON relocation_city_scores (snapshot_id);
