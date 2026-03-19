-- Sprint 1: Weight rules (answer -> macroarea weights) + city waiting list

-- 9. Weight rules mapping: onboarding answers -> 6-element weight vector
CREATE TABLE IF NOT EXISTS relocation_weight_rules (
    id                  UUID PRIMARY KEY,
    question_key        VARCHAR(50)     NOT NULL,
    answer_value        VARCHAR(50)     NOT NULL,
    weight_adjustments  JSONB           NOT NULL,
    active              BOOLEAN         NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ     NOT NULL,
    updated_at          TIMESTAMPTZ     NOT NULL,
    UNIQUE (question_key, answer_value)
);

COMMENT ON TABLE relocation_weight_rules IS 'Maps onboarding answers to weight adjustments on 6 macroaree; admin-editable without code release';
COMMENT ON COLUMN relocation_weight_rules.question_key IS 'life_state, relocation_time, age_range, relationship, motivation, work_type, need';
COMMENT ON COLUMN relocation_weight_rules.answer_value IS 'e.g. moving, already_here, within_3_months, 18_24, alone, career, housing';
COMMENT ON COLUMN relocation_weight_rules.weight_adjustments IS 'e.g. {costo_vita: 5, mercato_immobiliare: 10, opportunita_lavorative: 5}';

-- 10. City waiting list (for cities not yet in the dataset)
CREATE TABLE IF NOT EXISTS relocation_city_waiting_list (
    id          UUID PRIMARY KEY,
    email       VARCHAR(255)    NOT NULL,
    city_name   VARCHAR(255)    NOT NULL,
    user_id     UUID            REFERENCES users(id),
    session_id  UUID            REFERENCES expats_anonymous_sessions(id),
    notified    BOOLEAN         NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ     NOT NULL
);

COMMENT ON TABLE relocation_city_waiting_list IS 'Users requesting notification when a city is added to the dataset';

CREATE INDEX IF NOT EXISTS idx_waiting_list_city ON relocation_city_waiting_list (city_name);
CREATE INDEX IF NOT EXISTS idx_waiting_list_notified ON relocation_city_waiting_list (notified);
