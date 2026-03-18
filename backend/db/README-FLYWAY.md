# Flyway migrations

## Duplicate version / stale `target/classes`

If you see **Found more than one migration with version X**:

1. Run **`mvn clean compile`** from `backend`, or delete **`backend/target`**, then start again.

## Validate failed: checksum mismatch / “applied migration not resolved locally”

Flyway compares **`flyway_schema_history`** with files under **`src/main/resources/db/migration/`**. If they diverge, startup fails.

### Local / dev database (wipe + re-migrate)

1. Stop the backend.
2. Run **`reset-dev-schema.sql`** (adjust schema/user if needed), **or**:

   ```sql
   DROP SCHEMA IF EXISTS syncro_dev CASCADE;
   CREATE SCHEMA syncro_dev AUTHORIZATION current_user;
   ```

3. Start the app with profile **`dev`**. Flyway will baseline and apply migrations.

### Shared or production database

Do **not** drop the schema without a planned path and backups.

### One-off repair

When scripts match what was already applied but history is out of sync:

```bash
cd backend
mvn flyway:repair
```
