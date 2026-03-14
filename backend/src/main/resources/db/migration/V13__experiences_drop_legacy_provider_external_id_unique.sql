-- experiences: drop legacy unique on (provider, external_id) so (provider, external_id, locale) can repeat.
-- App uses syncro_dev in dev (see spring.flyway.schemas). Prod: set POSTGRES_SCHEMA or run equivalent.
ALTER TABLE syncro_dev.experiences DROP CONSTRAINT IF EXISTS ux_experiences_provider_external_id;
DROP INDEX IF EXISTS syncro_dev.ux_experiences_provider_external_id;
