#!/bin/bash

# Syncro Backend - Local Development Starter (Debug Mode)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ -f "$ENV_FILE" ]]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

cd "$BACKEND_DIR"

echo ""
echo "Syncro Backend - Development Mode"
echo "=================================="
echo ""
echo "Scegli un'opzione:"
echo "  1) Build + Run (compila e avvia)"
echo "  2) Run only (avvia senza compilare)"
echo ""
read -p "Scelta [1/2]: " choice

case $choice in
    1)
        echo ""
        echo "Eseguo build..."
        ./mvnw compile -DskipTests
        echo ""
        echo "Build completata. Avvio backend..."
        ;;
    2)
        echo ""
        echo "Avvio backend senza build..."
        ;;
    *)
        echo "Scelta non valida. Uso default: Run only"
        echo ""
        echo "Avvio backend senza build..."
        ;;
esac

echo ""

if command -v pg_isready >/dev/null 2>&1; then
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_NAME="${POSTGRES_DB:-postgres}"
    DB_USER="${POSTGRES_USER:-postgres}"

    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" >/dev/null 2>&1; then
        echo "Errore: PostgreSQL non raggiungibile su $DB_HOST:$DB_PORT (db=$DB_NAME, user=$DB_USER)."
        echo "Avvia prima il database locale e poi rilancia questo script."
        exit 1
    fi
else
    echo "Avviso: pg_isready non trovato, salto il controllo connessione PostgreSQL."
    echo ""
fi

if [[ "${ENABLE_JDWP:-false}" == "true" ]]; then
    echo "JDWP debug abilitato su porta 5005 (ENABLE_JDWP=true)"
    echo ""
    ./mvnw spring-boot:run \
        -Dspring-boot.run.profiles=dev \
        -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
        -DskipTests
else
    ./mvnw spring-boot:run \
        -Dspring-boot.run.profiles=dev \
        -DskipTests
fi
