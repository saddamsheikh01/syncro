-- Add locale column to experiences for content language (Viator results stored per locale).
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS locale VARCHAR(16);

COMMENT ON COLUMN experiences.locale IS 'Content language (e.g. en, it). For Viator: upsert by (provider, external_id, locale).';

-- Unique constraint for Viator rows: same product in different languages = separate rows.
-- IF NOT EXISTS: safe if index was created manually or already applied.
CREATE UNIQUE INDEX IF NOT EXISTS idx_experiences_viator_provider_external_locale
    ON experiences (provider, external_id, locale)
    WHERE provider IS NOT NULL AND external_id IS NOT NULL AND locale IS NOT NULL;
