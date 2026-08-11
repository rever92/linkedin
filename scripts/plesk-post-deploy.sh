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

# Plesk ejecuta las acciones Git con un PATH mínimo que normalmente no incluye
# el runtime seleccionado en Node.js Toolkit. Localiza npm y añade su Node al
# PATH para que el shebang `#!/usr/bin/env node` de npm también funcione.
NPM_BIN="$(command -v npm || true)"
SELECTED_NODE_MAJOR=0

if [[ -z "$NPM_BIN" ]]; then
  for NODE_BIN_DIR in /opt/plesk/node/*/bin; do
    if [[ ! -x "$NODE_BIN_DIR/node" || ! -x "$NODE_BIN_DIR/npm" ]]; then
      continue
    fi

    NODE_MAJOR="$($NODE_BIN_DIR/node -p "process.versions.node.split('.')[0]")"
    if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && (( NODE_MAJOR >= 18 && NODE_MAJOR > SELECTED_NODE_MAJOR )); then
      SELECTED_NODE_MAJOR="$NODE_MAJOR"
      NPM_BIN="$NODE_BIN_DIR/npm"
    fi
  done
fi

if [[ -z "$NPM_BIN" ]]; then
  echo "[deploy] npm no está disponible. Comprueba que Node.js Toolkit está habilitado para el dominio." >&2
  exit 1
fi

NODE_BIN_DIR="${NPM_BIN%/*}"
export PATH="$NODE_BIN_DIR:$PATH"
echo "[deploy] Node: $(node --version)"
echo "[deploy] npm: $NPM_BIN"

if [[ ! -f package-lock.json ]]; then
  echo "[deploy] package-lock.json no encontrado. Abortando." >&2
  exit 1
fi

if [[ ! -f .env.production ]]; then
  echo "[deploy] .env.production no existe; se usarán los valores por defecto del frontend y las variables de Node.js configuradas en Plesk."
fi

echo "[deploy] Instalando dependencias con devDependencies para el build..."
"$NPM_BIN" ci --include=dev

echo "[deploy] Generando dist de produccion..."
"$NPM_BIN" run build

if [[ -d "$RESTART_DIR" ]]; then
  touch "$RESTART_FILE"
  echo "[deploy] Reinicio solicitado via $RESTART_FILE"
else
  echo "[deploy] No se encontro ../tmp. Si el cambio afecta al backend, reinicia la app desde Plesk."
fi

echo "[deploy] Despliegue completado."
