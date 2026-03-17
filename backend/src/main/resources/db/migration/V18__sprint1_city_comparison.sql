-- V18: Aggiunge supporto City Comparison alla tabella relocation_profiles
-- Nuovi campi: current_city_id e current_city_name per confronto tra citta corrente e target

ALTER TABLE relocation_profiles
    ADD COLUMN IF NOT EXISTS current_city_id UUID,
    ADD COLUMN IF NOT EXISTS current_city_name VARCHAR(255);

-- FK verso relocation_city_dataset per la citta corrente
-- Guard added: V14 may have already created this constraint as part of the catch-up migration.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_relocation_profiles_current_city'
          AND conrelid = 'relocation_profiles'::regclass
    ) THEN
        ALTER TABLE relocation_profiles
            ADD CONSTRAINT fk_relocation_profiles_current_city
                FOREIGN KEY (current_city_id) REFERENCES relocation_city_dataset (id);
    END IF;
END $$;

-- Indice per join sulla citta corrente
CREATE INDEX IF NOT EXISTS idx_relocation_profiles_current_city
    ON relocation_profiles (current_city_id);

COMMENT ON COLUMN relocation_profiles.current_city_id IS 'Citta in cui l utente vive attualmente, usata per city comparison';
COMMENT ON COLUMN relocation_profiles.current_city_name IS 'Nome denormalizzato della citta corrente per display';
