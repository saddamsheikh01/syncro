-- Aggiunge campo image_url alla tabella relocation_city_dataset
-- Permette di associare una foto/immagine a ogni citta, gestibile da backoffice admin

ALTER TABLE relocation_city_dataset ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

COMMENT ON COLUMN relocation_city_dataset.image_url IS 'URL immagine rappresentativa della citta (gestita da backoffice admin)';
