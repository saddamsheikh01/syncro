#!/bin/bash
set -e

echo "===================================="
echo "🚀 Deploy Syncro Frontend - PROD"
echo "===================================="

BASE_DIR="/opt/apps/syncro"
FRONTEND_DIR="$BASE_DIR/frontend"

echo "📁 Spostamento in repo"
cd $BASE_DIR

echo "🔁 Checkout branch prod"
git fetch origin
git checkout prod
git pull origin prod

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

echo "💾 PM2 save"
pm2 save

echo "✅ Deploy frontend completato con successo"
