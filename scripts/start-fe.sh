#!/bin/bash

# Syncro Frontend - Local Development Starter (Next.js)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "Starting Syncro Frontend (Next.js dev)..."

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Frontend package.json not found at $FRONTEND_DIR" >&2
  exit 1
fi

cd "$FRONTEND_DIR"

npm install
npm run build
npm run dev
