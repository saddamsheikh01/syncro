#!/bin/bash
set -e

echo "===================================="
echo "Deploy Syncro - STAGING"
echo "===================================="

BASE_DIR="/opt/apps/syncro-staging"

BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"
ENV_FILE="$BASE_DIR/.env.staging"
DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

echo "Spostamento in repo"
cd $BASE_DIR

echo ""
echo "Cosa vuoi deployare?"
echo "  1) Backend"
echo "  2) Frontend"
echo "  3) Entrambi"
echo ""
read -r -p "Scelta [1/2/3, default 3]: " deploy_choice

case "$deploy_choice" in
  1)
    DEPLOY_BACKEND=true
    ;;
  2)
    DEPLOY_FRONTEND=true
    ;;
  3|"")
    DEPLOY_BACKEND=true
    DEPLOY_FRONTEND=true
    ;;
  *)
    echo "Scelta non valida. Uso default: Entrambi."
    DEPLOY_BACKEND=true
    DEPLOY_FRONTEND=true
    ;;
esac

echo "Caricamento environment staging"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  echo "Environment caricato da $ENV_FILE"
else
  echo "File environment non trovato: $ENV_FILE"
  exit 1
fi

echo "Checkout branch staging"
git fetch origin
git checkout staging
git pull origin staging

if [ "$DEPLOY_BACKEND" = true ]; then
  echo "===================================="
  echo "BACKEND"
  echo "===================================="

  cd $BACKEND_DIR

  echo "Build backend (skip tests)"
  ./mvnw clean package -DskipTests

  echo "Restart backend via PM2"
  pm2 describe syncro-staging-be >/dev/null 2>&1 && \
    pm2 restart syncro-staging-be --update-env || \
    pm2 start "java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=staging" \
      --name syncro-staging-be
fi

if [ "$DEPLOY_FRONTEND" = true ]; then
  echo "===================================="
  echo "FRONTEND"
  echo "===================================="

  cd $FRONTEND_DIR

  echo "Configurazione env staging per Next.js"
  cp .env.staging.local .env.production.local

  echo "Install deps"
  npm install

  echo "Build frontend (staging)"
  npm run build

  echo "Restart frontend via PM2"
  pm2 describe syncro-staging-fe >/dev/null 2>&1 && \
    pm2 restart syncro-staging-fe --update-env || \
    PORT=3006 pm2 start npm \
      --name syncro-staging-fe \
      -- start
fi

echo "===================================="
echo "PM2 save"
echo "===================================="

pm2 save

echo "Deploy staging completato con successo"
