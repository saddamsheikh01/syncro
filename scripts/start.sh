#!/bin/bash

# Syncro - Local Development Starter (Backend + Frontend)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "Starting Syncro Backend (dev profile, debug mode)..."

(
  cd "$BACKEND_DIR"
  ./mvnw spring-boot:run \
    -Dspring-boot.run.profiles=dev \
    -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
    -DskipTests
) &
BACKEND_PID=$!

cleanup() {
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
  fi
}
trap cleanup EXIT

echo "Starting Syncro Frontend (Next.js dev)..."

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Frontend package.json not found at $FRONTEND_DIR" >&2
  exit 1
fi

cd "$FRONTEND_DIR"

npm install
npm run build
npm run dev
