#!/usr/bin/env bash
# --------------------------------------------------------------------------
# check-flyway-version.sh
# Queries flyway_schema_history to show the current DB migration version.
# Reads DB connection from .env (same vars used by Spring Boot).
# --------------------------------------------------------------------------

set -euo pipefail

# Load .env from project root (same file Spring reads)
ENV_FILE="${1:-$(cd "$(dirname "$0")/../.." && pwd)/.env}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${POSTGRES_HOST:=localhost}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DB:=syncro_db}"
: "${POSTGRES_USER:=postgres}"
: "${POSTGRES_SCHEMA:=public}"

export PGPASSWORD="${POSTGRES_PASSWORD:-}"

echo "Connecting to ${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB} (schema: ${POSTGRES_SCHEMA})"
echo "---"

psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SET search_path TO ${POSTGRES_SCHEMA};" \
  -c "SELECT version, description, installed_on, success
      FROM flyway_schema_history
      ORDER BY installed_rank DESC
      LIMIT 20;"
