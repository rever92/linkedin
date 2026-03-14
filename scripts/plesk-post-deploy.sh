#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESTART_FILE="$APP_ROOT/../tmp/restart.txt"

cd "$APP_ROOT"

echo "[deploy] App root: $APP_ROOT"

if [[ ! -f package-lock.json ]]; then
  echo "[deploy] package-lock.json no encontrado. Abortando." >&2
  exit 1
fi

if [[ ! -f .env.production ]]; then
  echo "[deploy] Falta .env.production en la raiz del proyecto. Abortando." >&2
  exit 1
fi

echo "[deploy] Instalando dependencias con devDependencies para el build..."
npm ci --include=dev

echo "[deploy] Generando dist de produccion..."
npm run build

if [[ -d "$(dirname "$RESTART_FILE")" ]]; then
  touch "$RESTART_FILE"
  echo "[deploy] Reinicio solicitado via $RESTART_FILE"
else
  echo "[deploy] No se encontro ../tmp. Si el cambio afecta al backend, reinicia la app desde Plesk."
fi

echo "[deploy] Despliegue completado."
