# Flyway migrations

## Versioning checklist (queries ↔ DB ↔ test)

Keep these three in sync:

| What | Where | Current value |
|------|--------|----------------|
| **Latest migration file** | `src/main/resources/db/migration/V*.sql` | `V25__ensure_city_scoring_config.sql` |
| **DB version after migrate** | Highest version in `flyway_schema_history` | **25** |
| **Test constant** | `FlywaySchemaSmokeTest.CURRENT_FLYWAY_VERSION` | **25** |
| **Baseline** | All profiles (`application-*.yml`) | **8** (`baseline-version: 8`) |

- **Queries:** There must be exactly one file per version **8** (baseline) and **9 … 25** (no gaps). Versions 1–7 exist on disk but are **not** applied when using baseline-on-migrate on a new DB.
- **When adding V26:** (1) Add `V26__description.sql`, (2) Add a row to the table below, (3) Set `CURRENT_FLYWAY_VERSION = 26` in `FlywaySchemaSmokeTest.java`.

---

## Migration versioning (queries vs DB)

**Current DB version:** **25** (latest migration = `V25__ensure_city_scoring_config.sql`).

| Version | File | Description |
|--------|------|-------------|
| 1 | V1__email_notification_schema.sql | Email notification schema |
| 2 | V2__user_last_login_tracking.sql | User last login tracking |
| 3 | V3__user_last_active_at.sql | User last active at |
| 4 | V4__email_verification_otp.sql | Email verification OTP |
| 5 | V5__astrology_birth_place_and_degrees.sql | Astrology birth place and degrees |
| 6 | V6__zyra_birth_chart_interpretation.sql | Zyra birth chart interpretation |
| 7 | V7__email_change_otp_target_email.sql | Email change OTP target email |
| **8** | **V8__viator_destination_refs.sql** | **Baseline** – Viator destination refs |
| 9 | V9__zyra_recap_highlights.sql | Zyra recap highlights |
| 10 | V10__profile_recap_pending_refresh.sql | Profile recap pending refresh |
| 11 | V11__sprint1_funnel_tables.sql | Sprint1 funnel tables |
| 12 | V12__sprint1_relocation_profile_tables.sql | Relocation profile + snapshots |
| 13 | V13__sprint1_city_dataset.sql | City dataset |
| 14 | V14__sprint1_weight_rules_and_waiting_list.sql | Weight rules + waiting list |
| 15 | V15__sprint1_city_scores.sql | City scores |
| 16 | V16__seed_expats_funnel_config.sql | Seed expats funnel config |
| 17 | V17__sprint1_scoring_config.sql | Scoring config |
| 18 | V18__sprint1_weight_rules_seed.sql | Weight rules seed |
| 19 | V19__widen_analytics_ingestion_errors_columns.sql | Analytics ingestion errors columns |
| 20 | V20__sprint1_city_comparison.sql | City comparison |
| 21 | V21__anonymous_relocation_wow.sql | Anonymous relocation WOW |
| 22 | V22__version_placeholder.sql | No-op placeholder (keeps version sequence 9–25 for smoke test) |
| 23 | V23__ensure_anonymous_relocation_columns.sql | Ensure V21 city_scores anonymous columns (idempotent) |
| 24 | V24__ensure_anonymous_relocation_snapshots_profiles.sql | Ensure V21 profiles + snapshots anonymous columns (idempotent) |
| 25 | V25__ensure_city_scoring_config.sql | Ensure city scoring config |

- **Baseline:** All profiles use `baseline-version: 8` and `baseline-on-migrate: true`. On a fresh DB, Flyway records **8** then **9 … 25** in `flyway_schema_history` (V1–V7 are pre-baseline and not applied in new envs).
- **Alignment:** `FlywaySchemaSmokeTest` asserts that the schema history contains versions **8** and **9–25** after migrations run. When you add a new migration (e.g. V26), add it to this table and bump `CURRENT_FLYWAY_VERSION` in `FlywaySchemaSmokeTest.java`.

## Integration tests (`FlywaySchemaSmokeTest`, `*IntegrationTest`)

These tests use **Testcontainers** (`postgres:16-alpine`). They fail if Docker is not available to the JVM:

- **Symptom:** `Could not find a valid Docker environment` → `Error creating bean with name 'com.syncro.backend.support.TestContainersConfig'`
- **Fix:** Start **Docker Desktop** (or Docker Engine), then run `./mvnw test` from a shell where Docker is reachable. On Windows, Maven/IDE must see the same Docker context as `docker version`.

**No Flyway/schema bug** in that case—the context never reaches Flyway until the container starts.

To run integration tests when Docker is available: `./mvnw test -Pintegration`.

Default `./mvnw test` excludes `*IntegrationTest` and `FlywaySchemaSmokeTest` so the build passes without Docker (see `pom.xml` surefire configuration).

## Duplicate version / stale `target/classes`

If you see **Found more than one migration with version X**:

1. Run **`mvn clean compile`** from `backend`, or delete **`backend/target`**, then start again.

## Validate failed: checksum mismatch / “applied migration not resolved locally”

Flyway compares **`flyway_schema_history`** with files under **`src/main/resources/db/migration/`**. If a migration was applied and the file was later changed, you get:

- **Migration checksum mismatch for migration version X**  
  `Applied to database : …` / `Resolved locally : …`

### Fix: repair (update history to match current files)

Use this when the **current** migration files are correct and the DB is already in the desired state (e.g. you edited V21 after it was applied):

```bash
cd backend
# Set DB credentials (same as app). Example:
set FLYWAY_PASSWORD=your_db_password
mvn flyway:repair
```

Or: `mvn flyway:repair -Dflyway.password=your_db_password`. Then restart the app.

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
