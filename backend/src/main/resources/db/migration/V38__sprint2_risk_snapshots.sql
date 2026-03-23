-- Sprint 2: Relocation risk snapshots
CREATE TABLE IF NOT EXISTS relocation_risk_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario VARCHAR(30),
    source_type VARCHAR(50),
    risk_indicators JSONB,
    burnout_index INTEGER,
    overall_risk_level VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_user_created ON relocation_risk_snapshots(user_id, created_at DESC);
