#!/bin/bash

# Syncro Backend - Local Development Starter (Debug Mode)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "🚀 Starting Syncro Backend (dev profile, debug mode)..."

cd "$BACKEND_DIR"

./mvnw spring-boot:run \
    -Dspring-boot.run.profiles=dev \
    -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
    -DskipTests
