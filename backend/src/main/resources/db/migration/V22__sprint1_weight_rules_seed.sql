-- Sprint 1: Seed data for relocation_weight_rules (from client PDFs, 9 March 2026)
-- Each row maps a (question_key, answer_value) pair to weight adjustments on the 6 macroaree.
-- Weights accumulate from all answers; normalization happens in the Java service.

-- LIFE STATE (question_key: life_state)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'life_state', 'moving',       '{"costo_vita": 5, "mercato_immobiliare": 10, "opportunita_lavorative": 5}'::jsonb,          true, now(), now()),
(gen_random_uuid(), 'life_state', 'already_here',  '{"qualita_vita": 5, "integrazione_sociale": 10}'::jsonb,                                    true, now(), now()),
(gen_random_uuid(), 'life_state', 'dont_know',     '{"qualita_vita": 5, "costo_vita": 5}'::jsonb,                                               true, now(), now());

-- RELOCATION TIME (question_key: relocation_time)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'relocation_time', 'dont_know',              '{"costo_vita": 5, "qualita_vita": 5, "opportunita_lavorative": 5}'::jsonb,                                              true, now(), now()),
(gen_random_uuid(), 'relocation_time', 'within_3_months',        '{"mercato_immobiliare": 15, "costo_vita": 10, "integrazione_sociale": 5, "opportunita_lavorative": 5}'::jsonb,          true, now(), now()),
(gen_random_uuid(), 'relocation_time', '3_to_12_months',         '{"mercato_immobiliare": 10, "costo_vita": 10, "qualita_vita": 5, "opportunita_lavorative": 5}'::jsonb,                  true, now(), now()),
(gen_random_uuid(), 'relocation_time', 'less_than_6_months_here','{"integrazione_sociale": 15, "qualita_vita": 10, "opportunita_lavorative": 5, "mercato_immobiliare": 5}'::jsonb,        true, now(), now());

-- AGE RANGE (question_key: age_range)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'age_range', '18_24', '{"integrazione_sociale": 10, "opportunita_lavorative": 5, "costo_vita": 10, "mercato_immobiliare": 5}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'age_range', '25_34', '{"opportunita_lavorative": 10, "integrazione_sociale": 10, "qualita_vita": 5}'::jsonb,                          true, now(), now()),
(gen_random_uuid(), 'age_range', '35_44', '{"qualita_vita": 10, "mercato_immobiliare": 10, "potere_economico": 5}'::jsonb,                                 true, now(), now()),
(gen_random_uuid(), 'age_range', '45_54', '{"qualita_vita": 15, "potere_economico": 10, "mercato_immobiliare": 5}'::jsonb,                                 true, now(), now());

-- RELATIONSHIP (question_key: relationship)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'relationship', 'alone',          '{"integrazione_sociale": 10, "opportunita_lavorative": 5}'::jsonb,                       true, now(), now()),
(gen_random_uuid(), 'relationship', 'couple',         '{"mercato_immobiliare": 5, "qualita_vita": 5}'::jsonb,                                  true, now(), now()),
(gen_random_uuid(), 'relationship', 'with_children',  '{"qualita_vita": 15, "mercato_immobiliare": 10, "integrazione_sociale": 5}'::jsonb,     true, now(), now()),
(gen_random_uuid(), 'relationship', 'with_pets',      '{"mercato_immobiliare": 5, "qualita_vita": 5}'::jsonb,                                  true, now(), now());

-- MOTIVATION (question_key: motivation)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'motivation', 'career',           '{"opportunita_lavorative": 15, "integrazione_sociale": -5, "potere_economico": 10}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'motivation', 'remote_work',      '{"qualita_vita": 10, "integrazione_sociale": 5, "costo_vita": 10, "opportunita_lavorative": -5}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'motivation', 'school',           '{"qualita_vita": 15, "mercato_immobiliare": 10, "integrazione_sociale": 10}'::jsonb,    true, now(), now()),
(gen_random_uuid(), 'motivation', 'quality_of_life',  '{"qualita_vita": 20, "integrazione_sociale": 10, "costo_vita": 5}'::jsonb,              true, now(), now());

-- WORK TYPE (question_key: work_type)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'work_type', 'employed',      '{"opportunita_lavorative": 10, "potere_economico": 10}'::jsonb,                             true, now(), now()),
(gen_random_uuid(), 'work_type', 'entrepreneur',  '{"opportunita_lavorative": 10, "integrazione_sociale": 5, "potere_economico": 5}'::jsonb,   true, now(), now()),
(gen_random_uuid(), 'work_type', 'freelance',     '{"costo_vita": 10, "qualita_vita": 5, "integrazione_sociale": 5}'::jsonb,                   true, now(), now()),
(gen_random_uuid(), 'work_type', 'student',       '{"costo_vita": 10, "integrazione_sociale": 10, "qualita_vita": 5}'::jsonb,                  true, now(), now());

-- NEED / PRIORITY PROBLEM (question_key: need)
INSERT INTO relocation_weight_rules (id, question_key, answer_value, weight_adjustments, active, created_at, updated_at) VALUES
(gen_random_uuid(), 'need', 'housing',               '{"mercato_immobiliare": 15, "costo_vita": 10}'::jsonb,              true, now(), now()),
(gen_random_uuid(), 'need', 'monthly_costs',          '{"costo_vita": 15, "potere_economico": 10}'::jsonb,                true, now(), now()),
(gen_random_uuid(), 'need', 'professional_network',   '{"opportunita_lavorative": 10, "integrazione_sociale": 10}'::jsonb, true, now(), now()),
(gen_random_uuid(), 'need', 'neighborhoods',          '{"mercato_immobiliare": 10, "qualita_vita": 5}'::jsonb,            true, now(), now());
