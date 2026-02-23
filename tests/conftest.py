"""Configura el directorio raíz en sys.path para que los tests puedan importar server.py."""

import sys
from pathlib import Path

# Agrega la raíz del proyecto al path
sys.path.insert(0, str(Path(__file__).parent.parent))
