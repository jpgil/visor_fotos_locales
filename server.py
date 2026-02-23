"""
visor_fotos - Servidor Local

Servidor FastAPI que expone endpoints para listar y servir imágenes
desde un directorio local del sistema de archivos.

Endpoints:
    GET /api/fotos?dir=<path>            — Lista de imágenes en orden alfabético.
    GET /api/foto/{filename}?dir=<path>  — Sirve un archivo de imagen individual.
    GET /                                — Sirve el frontend (static/index.html).

IMPORTANTE: StaticFiles está montado en /static (no en /) para evitar que
intercepte las rutas /api/... antes de que FastAPI las maneje.

Uso:
    uvicorn server:app --reload --port 8000
"""

import os
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"}
"""Extensiones de imagen aceptadas (en minúsculas, con punto)."""

app = FastAPI(title="visor_fotos", version="1.0.0")


def list_image_files(directory: str) -> List[str]:
    """Retorna los nombres de archivos de imagen dentro de *directory*, en orden alfabético.

    Args:
        directory: Ruta absoluta al directorio que contiene las imágenes.

    Returns:
        Lista de nombres de archivo (solo el basename) cuyas extensiones
        coinciden con ``ALLOWED_EXTENSIONS``, ordenados alfabéticamente
        sin importar mayúsculas/minúsculas.

    Raises:
        FileNotFoundError: Si *directory* no existe.
        NotADirectoryError: Si *directory* existe pero no es un directorio.
    """
    dir_path = Path(directory)

    if not dir_path.exists():
        raise FileNotFoundError(f"El directorio no existe: {directory}")
    if not dir_path.is_dir():
        raise NotADirectoryError(f"La ruta no es un directorio: {directory}")

    files: List[str] = []
    for entry in dir_path.iterdir():
        if entry.is_file() and entry.suffix.lower() in ALLOWED_EXTENSIONS:
            files.append(entry.name)

    files.sort(key=lambda name: name.lower())
    return files


@app.get("/api/fotos")
async def get_fotos(dir: str = Query(..., description="Ruta absoluta al directorio de imágenes")):
    """Retorna la lista de archivos de imagen en el directorio especificado.

    Args:
        dir: Ruta absoluta al directorio.

    Returns:
        JSON con ``{"fotos": [...], "total": N}``.
    """
    try:
        fotos = list_image_files(dir)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Directorio no encontrado: {dir}")
    except NotADirectoryError:
        raise HTTPException(status_code=400, detail=f"La ruta no es un directorio: {dir}")

    return {"fotos": fotos, "total": len(fotos)}


@app.get("/api/foto/{filename}")
async def get_foto(
    filename: str,
    dir: str = Query(..., description="Ruta absoluta al directorio de imágenes"),
):
    """Sirve un archivo de imagen individual desde el directorio especificado.

    Args:
        filename: Nombre del archivo de imagen.
        dir: Ruta absoluta al directorio que contiene la imagen.

    Returns:
        El archivo de imagen como respuesta binaria.
    """
    dir_path = Path(dir)
    file_path = dir_path / filename

    # Seguridad: prevenir path traversal
    try:
        file_path = file_path.resolve()
        dir_resolved = dir_path.resolve()
        if not str(file_path).startswith(str(dir_resolved)):
            raise HTTPException(status_code=403, detail="Acceso denegado: path traversal detectado")
    except (OSError, ValueError):
        raise HTTPException(status_code=400, detail="Ruta inválida")

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Imagen no encontrada: {filename}")

    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extensión no permitida: {file_path.suffix}")

    return FileResponse(file_path)


# Servir index.html en la raíz explícitamente
static_dir = Path(__file__).parent / "static"

@app.get("/")
async def serve_index():
    """Sirve el frontend (index.html)."""
    index_path = static_dir / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend no encontrado")
    return FileResponse(index_path)


# Montar archivos estáticos en /static (no en / para no interceptar rutas API)
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
