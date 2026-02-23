"""
Tests unitarios para server.py

Verifica los endpoints de listado y servicio de imágenes:
- GET /api/fotos con directorio válido, inválido y vacío.
- Filtrado por extensiones permitidas.
- Orden alfabético.
- GET /api/foto/{filename} con imágenes válidas e inválidas.
- Protección contra path traversal.
"""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from server import app, list_image_files

client = TestClient(app)


# --- Fixtures ---

@pytest.fixture
def temp_dir_with_images(tmp_path: Path) -> Path:
    """Crea un directorio temporal con archivos de imagen de prueba."""
    for name in ["alpha.jpg", "beta.png", "gamma.gif", "delta.webp", "Epsilon.JPEG"]:
        (tmp_path / name).write_bytes(b"\x00")
    # Archivo que NO es imagen
    (tmp_path / "readme.txt").write_text("no soy imagen")
    (tmp_path / "script.py").write_text("print('hola')")
    return tmp_path


@pytest.fixture
def temp_dir_empty(tmp_path: Path) -> Path:
    """Crea un directorio temporal vacío (sin imágenes)."""
    return tmp_path / "empty"


# --- Tests de list_image_files() ---

class TestListImageFiles:
    """Tests para la función list_image_files()."""

    def test_returns_only_images(self, temp_dir_with_images: Path):
        """Solo retorna archivos con extensiones de imagen permitidas."""
        result = list_image_files(str(temp_dir_with_images))
        assert "readme.txt" not in result
        assert "script.py" not in result
        assert len(result) == 5

    def test_alphabetical_order(self, temp_dir_with_images: Path):
        """Los archivos se retornan en orden alfabético case-insensitive."""
        result = list_image_files(str(temp_dir_with_images))
        assert result == ["alpha.jpg", "beta.png", "delta.webp", "Epsilon.JPEG", "gamma.gif"]

    def test_nonexistent_directory(self):
        """Lanza FileNotFoundError para directorios inexistentes."""
        with pytest.raises(FileNotFoundError):
            list_image_files("/ruta/que/no/existe/jamas")

    def test_not_a_directory(self, temp_dir_with_images: Path):
        """Lanza NotADirectoryError si la ruta es un archivo, no un directorio."""
        file_path = temp_dir_with_images / "alpha.jpg"
        with pytest.raises(NotADirectoryError):
            list_image_files(str(file_path))

    def test_empty_directory(self, tmp_path: Path):
        """Retorna lista vacía para directorio sin imágenes."""
        empty = tmp_path / "empty"
        empty.mkdir()
        result = list_image_files(str(empty))
        assert result == []


# --- Tests del endpoint GET /api/fotos ---

class TestGetFotosEndpoint:
    """Tests para el endpoint GET /api/fotos."""

    def test_valid_directory(self, temp_dir_with_images: Path):
        """Retorna 200 con lista de fotos y total."""
        response = client.get("/api/fotos", params={"dir": str(temp_dir_with_images)})
        assert response.status_code == 200
        data = response.json()
        assert "fotos" in data
        assert "total" in data
        assert data["total"] == 5
        assert data["fotos"] == ["alpha.jpg", "beta.png", "delta.webp", "Epsilon.JPEG", "gamma.gif"]

    def test_invalid_directory(self):
        """Retorna 404 para directorio inexistente."""
        response = client.get("/api/fotos", params={"dir": "/ruta/falsa/inexistente"})
        assert response.status_code == 404

    def test_empty_directory(self, tmp_path: Path):
        """Retorna 200 con lista vacía para directorio sin imágenes."""
        empty = tmp_path / "empty"
        empty.mkdir()
        response = client.get("/api/fotos", params={"dir": str(empty)})
        assert response.status_code == 200
        data = response.json()
        assert data["fotos"] == []
        assert data["total"] == 0

    def test_missing_dir_param(self):
        """Retorna 422 si falta el parámetro dir."""
        response = client.get("/api/fotos")
        assert response.status_code == 422


# --- Tests del endpoint GET /api/foto/{filename} ---

class TestGetFotoEndpoint:
    """Tests para el endpoint GET /api/foto/{filename}."""

    def test_valid_image(self, temp_dir_with_images: Path):
        """Retorna 200 al solicitar una imagen existente."""
        response = client.get(
            "/api/foto/alpha.jpg",
            params={"dir": str(temp_dir_with_images)},
        )
        assert response.status_code == 200

    def test_nonexistent_image(self, temp_dir_with_images: Path):
        """Retorna 404 para imagen que no existe."""
        response = client.get(
            "/api/foto/noexiste.jpg",
            params={"dir": str(temp_dir_with_images)},
        )
        assert response.status_code == 404

    def test_non_image_extension(self, temp_dir_with_images: Path):
        """Retorna 400 al solicitar archivo no-imagen."""
        response = client.get(
            "/api/foto/readme.txt",
            params={"dir": str(temp_dir_with_images)},
        )
        assert response.status_code == 400

    def test_path_traversal_blocked(self, temp_dir_with_images: Path):
        """Bloquea intentos de path traversal."""
        response = client.get(
            "/api/foto/../../etc/passwd",
            params={"dir": str(temp_dir_with_images)},
        )
        assert response.status_code in (403, 404, 400, 422)
