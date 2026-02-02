#!/bin/bash
set -e

echo "===================================="
echo "🚀 Deploy Syncro Backend - PROD"
echo "===================================="

BASE_DIR="/opt/apps/syncro"
BACKEND_DIR="$BASE_DIR/backend"

echo "📁 Spostamento in repo"
cd $BASE_DIR

echo "🔁 Checkout branch prod"
git fetch origin
git checkout prod
git pull origin prod

echo "===================================="
echo "🧱 BACKEND"
echo "===================================="

cd $BACKEND_DIR

echo "📦 Build backend (skip tests)"
./mvnw clean package -DskipTests

echo "♻️ Restart backend via PM2"
pm2 describe syncro-backend >/dev/null 2>&1 && \
  pm2 restart syncro-backend || \
  pm2 start "java -jar target/backend-0.0.1-SNAPSHOT.jar" \
    --name syncro-backend

echo "💾 PM2 save"
pm2 save

echo "✅ Deploy backend completato con successo"
