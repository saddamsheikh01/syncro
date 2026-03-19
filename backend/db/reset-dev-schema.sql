-- Reset Flyway + application objects for LOCAL DEV after migration renames.
-- Adjust schema name to match POSTGRES_SCHEMA (e.g. syncro_dev).

DROP SCHEMA IF EXISTS syncro_dev CASCADE;
CREATE SCHEMA syncro_dev;

-- Grant for your app user (replace postgres if needed)
GRANT ALL ON SCHEMA syncro_dev TO postgres;
ALTER SCHEMA syncro_dev OWNER TO postgres;
