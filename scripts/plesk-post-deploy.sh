#!/usr/bin/env bash

set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="${SCRIPT_PATH%/*}"
if [[ "$SCRIPT_DIR" == "$SCRIPT_PATH" ]]; then
  SCRIPT_DIR="."
fi
SCRIPT_DIR="$(cd "$SCRIPT_DIR" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESTART_DIR="$APP_ROOT/../tmp"
RESTART_FILE="$RESTART_DIR/restart.txt"

cd "$APP_ROOT"

echo "[deploy] App root: $APP_ROOT"

if [[ ! -f package-lock.json ]]; then
  echo "[deploy] package-lock.json no encontrado. Abortando." >&2
  exit 1
fi

if [[ ! -f .env.production ]]; then
  echo "[deploy] .env.production no existe; se usarán los valores por defecto del frontend y las variables de Node.js configuradas en Plesk."
fi

echo "[deploy] Instalando dependencias con devDependencies para el build..."
npm ci --include=dev

echo "[deploy] Generando dist de produccion..."
npm run build

if [[ -d "$RESTART_DIR" ]]; then
  touch "$RESTART_FILE"
  echo "[deploy] Reinicio solicitado via $RESTART_FILE"
else
  echo "[deploy] No se encontro ../tmp. Si el cambio afecta al backend, reinicia la app desde Plesk."
fi

echo "[deploy] Despliegue completado."
