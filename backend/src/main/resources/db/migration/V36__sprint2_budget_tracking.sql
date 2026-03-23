-- Sprint 2: Budget tracking (actual vs expected)
CREATE TABLE IF NOT EXISTS budget_tracking_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    simulation_id UUID REFERENCES budget_simulations(id),
    category VARCHAR(100) NOT NULL,
    expected_value NUMERIC(10,2),
    actual_value NUMERIC(10,2),
    delta NUMERIC(10,2),
    threshold NUMERIC(10,2),
    alert_status VARCHAR(20) DEFAULT 'OK',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_tracking_user_recorded ON budget_tracking_entries(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_tracking_user_category ON budget_tracking_entries(user_id, category);
