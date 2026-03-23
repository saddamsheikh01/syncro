-- Sprint 2: Micro-test progressive assignments
CREATE TABLE IF NOT EXISTS micro_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES test_definitions(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    available_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    submission_id UUID REFERENCES user_test_submissions(id),
    anti_repeat_window_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_micro_test_user_status ON micro_test_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_micro_test_user_test_available ON micro_test_assignments(user_id, test_id, available_from);
CREATE INDEX IF NOT EXISTS idx_micro_test_pending_active ON micro_test_assignments(user_id, status)
    WHERE status IN ('PENDING', 'ACTIVE');
