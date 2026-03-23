-- Sprint 2: Add block tracking fields to micro_test_assignments
-- Enables splitting tests into blocks of 3 questions

ALTER TABLE micro_test_assignments
    ADD COLUMN IF NOT EXISTS block_start_position INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS block_size INTEGER NOT NULL DEFAULT 3;
