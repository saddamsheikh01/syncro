INSERT INTO analytics_event_definitions (event_name, event_version, description, payload_required_keys, is_active)
VALUES
    ('BUDGET_SIMULATION_RUN', 1, 'Budget simulation executed', ARRAY['planCode', 'simulationId'], TRUE),
    ('BUDGET_TRACKING_ENTRY_CREATED', 1, 'Budget tracking entry created', ARRAY['category', 'alertStatus'], TRUE),
    ('STARTER_KIT_GENERATED', 1, 'Starter kit generated', ARRAY['scenario', 'reportId'], TRUE),
    ('MICRO_TEST_ASSIGNED', 1, 'Micro-test assignment created', ARRAY['testId', 'assignmentId', 'blockStart'], TRUE),
    ('MICRO_TEST_COMPLETED', 1, 'Micro-test block completed', ARRAY['assignmentId', 'testId'], TRUE)
ON CONFLICT (event_name, event_version) DO UPDATE
SET description = EXCLUDED.description,
    payload_required_keys = EXCLUDED.payload_required_keys,
    is_active = EXCLUDED.is_active;
