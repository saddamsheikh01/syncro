#!/bin/bash

# Syncro Backend - Local Development Starter (Debug Mode)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

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

./mvnw spring-boot:run \
    -Dspring-boot.run.profiles=dev \
    -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
    -DskipTests
