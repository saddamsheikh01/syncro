#!/bin/bash

# Syncro - Local Development Starter (Interactive)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"
ENV_FILE="$SCRIPT_DIR/../.env"

START_BACKEND=false
START_FRONTEND=false
BACKEND_BUILD=false
FRONTEND_BUILD=false
BACKEND_STARTED=false
FRONTEND_STARTED=false

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

BACKEND_PORT="${SERVER_PORT:-8080}"

kill_port_if_busy() {
  local port="$1"
  local pids

  if ! command -v lsof >/dev/null 2>&1; then
    echo "Avviso: lsof non trovato, salto cleanup porta $port."
    return
  fi

  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "Porta $port occupata: termino i processi in ascolto..."
  kill -TERM $pids 2>/dev/null || true
  sleep 1

  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    kill -KILL $pids 2>/dev/null || true
    sleep 1
  fi

  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Attenzione: porta $port ancora occupata (PID: $pids)."
  else
    echo "Porta $port liberata."
  fi
}

stop_process() {
  local name="$1"
  local pid="$2"

  if [[ -z "$pid" ]]; then
    return
  fi

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  echo "Arresto $name (PID $pid)..."
  if command -v pkill >/dev/null 2>&1; then
    pkill -TERM -P "$pid" 2>/dev/null || true
  fi
  kill -TERM "$pid" 2>/dev/null || true
  sleep 1

  if kill -0 "$pid" 2>/dev/null; then
    if command -v pkill >/dev/null 2>&1; then
      pkill -KILL -P "$pid" 2>/dev/null || true
    fi
    kill -KILL "$pid" 2>/dev/null || true
  fi
}

ensure_backend_bytecode_consistency() {
  if [[ ! -d "$BACKEND_DIR/target/classes" ]]; then
    return
  fi

  local stale_count
  if command -v rg >/dev/null 2>&1; then
    stale_count="$(
      rg -a -l "Unresolved compilation problems" "$BACKEND_DIR/target/classes" 2>/dev/null | wc -l
    )"
  else
    stale_count="$(
      grep -aR -l "Unresolved compilation problems" "$BACKEND_DIR/target/classes" 2>/dev/null | wc -l
    )"
  fi
  stale_count="${stale_count//[[:space:]]/}"

  if [[ "$stale_count" == "0" ]]; then
    return
  fi

  echo "Rilevati class file non validi dopo merge ($stale_count). Eseguo clean compile backend..."
  (
    cd "$BACKEND_DIR"
    ./mvnw clean compile -DskipTests
  )
}

cleanup() {
  trap - INT TERM EXIT
  set +e

  if [[ "$CLEANED_UP" -eq 1 ]]; then
    return
  fi
  CLEANED_UP=1

  echo ""
  echo "Shutdown servizi in corso..."
  stop_process "backend" "$BACKEND_PID"
  stop_process "frontend" "$FRONTEND_PID"

  if [[ "$BACKEND_STARTED" == true ]]; then
    kill_port_if_busy "$BACKEND_PORT"
    if [[ "${ENABLE_JDWP:-false}" == "true" ]]; then
      kill_port_if_busy 5005
    fi
  fi
  if [[ "$FRONTEND_STARTED" == true ]]; then
    kill_port_if_busy 3000
  fi
}

trap cleanup INT TERM EXIT

echo ""
echo "Syncro - Start Interattivo"
echo "=========================="
echo ""
echo "Quale servizio vuoi avviare?"
echo "  1) Backend"
echo "  2) Frontend"
echo "  3) Entrambi"
echo ""
read -r -p "Scelta [1/2/3, default 3]: " service_choice

case "$service_choice" in
  1)
    START_BACKEND=true
    ;;
  2)
    START_FRONTEND=true
    ;;
  3|"")
    START_BACKEND=true
    START_FRONTEND=true
    ;;
  *)
    echo "Scelta non valida. Uso default: Entrambi."
    START_BACKEND=true
    START_FRONTEND=true
    ;;
esac

if [[ "$START_BACKEND" == true ]]; then
  echo ""
  echo "Backend:"
  echo "  1) Build + Run (compila e avvia)"
  echo "  2) Run only (avvia senza compilare)"
  read -r -p "Scelta backend [1/2, default 2]: " backend_choice

  case "$backend_choice" in
    1) BACKEND_BUILD=true ;;
    2|"") BACKEND_BUILD=false ;;
    *)
      echo "Scelta backend non valida. Uso default: Run only."
      BACKEND_BUILD=false
      ;;
  esac
fi

if [[ "$START_FRONTEND" == true ]]; then
  echo ""
  echo "Frontend:"
  echo "  1) Build + Run (npm install, build e avvia)"
  echo "  2) Run only (avvia senza build)"
  read -r -p "Scelta frontend [1/2, default 2]: " frontend_choice

  case "$frontend_choice" in
    1) FRONTEND_BUILD=true ;;
    2|"") FRONTEND_BUILD=false ;;
    *)
      echo "Scelta frontend non valida. Uso default: Run only."
      FRONTEND_BUILD=false
      ;;
  esac
fi

if [[ "$START_BACKEND" == true ]]; then
  if [[ ! -d "$BACKEND_DIR" ]]; then
    echo "Backend directory non trovata: $BACKEND_DIR" >&2
    exit 1
  fi

  if command -v pg_isready >/dev/null 2>&1; then
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_NAME="${POSTGRES_DB:-postgres}"
    DB_USER="${POSTGRES_USER:-postgres}"

    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" >/dev/null 2>&1; then
      echo "Errore: PostgreSQL non raggiungibile su $DB_HOST:$DB_PORT (db=$DB_NAME, user=$DB_USER)." >&2
      echo "Avvia prima il database locale e poi rilancia questo script." >&2
      exit 1
    fi
  else
    echo "Avviso: pg_isready non trovato, salto il controllo connessione PostgreSQL."
  fi

  if [[ "$BACKEND_BUILD" == true ]]; then
    echo ""
    echo "Eseguo build backend..."
    (
      cd "$BACKEND_DIR"
      ./mvnw compile -DskipTests
    )
  fi
fi

if [[ "$START_FRONTEND" == true ]]; then
  if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
    echo "Frontend package.json non trovato: $FRONTEND_DIR/package.json" >&2
    exit 1
  fi

  if [[ "$FRONTEND_BUILD" == true ]]; then
    echo ""
    echo "Eseguo npm install + build frontend..."
    (
      cd "$FRONTEND_DIR"
      npm install
      npm run build
    )
  fi
fi

start_backend() {
  echo ""
  echo "Avvio backend..."
  ensure_backend_bytecode_consistency
  (
    cd "$BACKEND_DIR"
    if [[ "${ENABLE_JDWP:-false}" == "true" ]]; then
      exec ./mvnw spring-boot:run \
        -Dspring-boot.run.profiles=dev \
        -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
        -DskipTests
    else
      exec ./mvnw spring-boot:run \
        -Dspring-boot.run.profiles=dev \
        -DskipTests
    fi
  ) &
  BACKEND_PID=$!
  BACKEND_STARTED=true
}

start_frontend() {
  echo ""
  echo "Avvio frontend..."
  (
    cd "$FRONTEND_DIR"
    exec npm run dev
  ) &
  FRONTEND_PID=$!
  FRONTEND_STARTED=true
}

if [[ "$START_BACKEND" == true ]]; then
  start_backend
fi

if [[ "$START_FRONTEND" == true ]]; then
  start_frontend
fi

echo ""
echo "Servizi avviati. Premi Ctrl+C per arrestare tutto."

if [[ "$START_BACKEND" == true && "$START_FRONTEND" == true ]]; then
  while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "Backend terminato. Arresto anche frontend..."
      exit 1
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo "Frontend terminato. Arresto anche backend..."
      exit 1
    fi
    sleep 1
  done
elif [[ "$START_BACKEND" == true ]]; then
  wait "$BACKEND_PID"
elif [[ "$START_FRONTEND" == true ]]; then
  wait "$FRONTEND_PID"
fi
