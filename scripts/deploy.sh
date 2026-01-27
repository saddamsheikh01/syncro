#!/bin/bash
set -e

echo "===================================="
echo "🚀 Deploy Syncro - PROD"
echo "===================================="

BASE_DIR="/opt/apps/syncro"

BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

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

echo "===================================="
echo "🧱 FRONTEND"
echo "===================================="

cd $FRONTEND_DIR

echo "📦 Install deps"
npm install

echo "🏗️ Build frontend (prod)"
npm run build

echo "♻️ Restart frontend via PM2"
pm2 describe syncro-frontend >/dev/null 2>&1 && \
  pm2 restart syncro-frontend || \
  PORT=3003 pm2 start npm \
    --name syncro-frontend \
    -- start

echo "===================================="
echo "💾 PM2 save"
echo "===================================="

pm2 save

echo "✅ Deploy completato con successo"

