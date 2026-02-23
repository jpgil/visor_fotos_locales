#!/bin/bash
# visor_fotos - Script de arranque
# Crea (si no existe) y activa un virtual environment,
# instala dependencias, lanza el servidor y abre el navegador.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"

# Crear venv si no existe
if [ ! -d "$VENV_DIR" ]; then
    echo "🐍 Creando virtual environment en .venv ..."
    python3 -m venv "$VENV_DIR"
fi

# Activar venv
source "$VENV_DIR/bin/activate"

echo "📦 Instalando dependencias en .venv ..."
pip install -q -r requirements.txt

echo "🚀 Iniciando servidor en http://localhost:8000 ..."
echo "   Presiona Ctrl+C para detener."

# Abrir navegador tras breve espera (en background)
(sleep 2 && open "http://localhost:8000" 2>/dev/null || xdg-open "http://localhost:8000" 2>/dev/null) &

# Lanzar servidor
uvicorn server:app --host 0.0.0.0 --port 8000
