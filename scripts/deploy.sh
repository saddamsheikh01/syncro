#!/bin/bash
set -e

echo "===================================="
echo "🚀 Deploy Syncro - PROD"
echo "===================================="

BASE_DIR="/opt/apps/syncro"

BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"
ENV_FILE="$BASE_DIR/.env"

echo "📁 Spostamento in repo"
cd $BASE_DIR

echo "🌍 Caricamento environment produzione"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  echo "✅ Environment caricato da $ENV_FILE"
else
  echo "❌ File environment non trovato: $ENV_FILE"
  exit 1
fi

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
  pm2 restart syncro-backend --update-env || \
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
  pm2 restart syncro-frontend --update-env || \
  PORT=3003 pm2 start npm \
    --name syncro-frontend \
    -- start

echo "===================================="
echo "💾 PM2 save"
echo "===================================="

pm2 save

echo "✅ Deploy completato con successo"
