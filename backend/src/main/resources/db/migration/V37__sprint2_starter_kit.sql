-- Sprint 2: Starter Kit reports and actions
CREATE TABLE IF NOT EXISTS starter_kit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id UUID REFERENCES relocation_city_dataset(id),
    scenario VARCHAR(30),
    plan_code VARCHAR(20),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_starter_kit_reports_user ON starter_kit_reports(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS starter_kit_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES starter_kit_reports(id) ON DELETE CASCADE,
    action_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_starter_kit_actions_report ON starter_kit_actions(report_id);
