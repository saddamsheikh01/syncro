#!/bin/bash

# Syncro Frontend - Local Development Starter (Next.js)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Frontend package.json not found at $FRONTEND_DIR" >&2
  exit 1
fi

cd "$FRONTEND_DIR"

echo ""
echo "Syncro Frontend - Development Mode"
echo "==================================="
echo ""
echo "Scegli un'opzione:"
echo "  1) Build + Run (npm install, build e avvia)"
echo "  2) Run only (avvia senza build)"
echo ""
read -p "Scelta [1/2]: " choice

case $choice in
    1)
        echo ""
        echo "Eseguo npm install..."
        npm install
        echo ""
        echo "Eseguo build..."
        npm run build
        echo ""
        echo "Avvio frontend..."
        ;;
    2)
        echo ""
        echo "Avvio frontend senza build..."
        ;;
    *)
        echo "Scelta non valida. Uso default: Run only"
        echo ""
        echo "Avvio frontend senza build..."
        ;;
esac

echo ""

npm run dev
