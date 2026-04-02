-- Sprint 2: Allow anonymous budget simulations
-- user_id becomes nullable, anonymous_session_id added

ALTER TABLE budget_simulations
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE budget_simulations
    ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES expats_anonymous_sessions(id);

CREATE INDEX idx_budget_simulations_anon_session ON budget_simulations(anonymous_session_id)
    WHERE anonymous_session_id IS NOT NULL;
