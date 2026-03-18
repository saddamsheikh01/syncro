-- experiences: drop legacy unique on (provider, external_id) so (provider, external_id, locale) can repeat.
ALTER TABLE experiences DROP CONSTRAINT IF EXISTS ux_experiences_provider_external_id;
DROP INDEX IF EXISTS ux_experiences_provider_external_id;
