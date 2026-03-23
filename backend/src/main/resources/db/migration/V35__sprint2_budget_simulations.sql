-- Sprint 2: Budget simulation engine
CREATE TABLE IF NOT EXISTS budget_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id UUID REFERENCES relocation_city_dataset(id),
    scenario VARCHAR(30),
    plan_code VARCHAR(20) NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_simulations_user_created ON budget_simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_simulations_user_plan ON budget_simulations(user_id, plan_code);
