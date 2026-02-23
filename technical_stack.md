# Stack Técnico (technical_stack.md)

Este archivo documenta las tecnologías utilizadas en el proyecto `visor_fotos`.

## Lenguajes
- **Python 3.x** — Servidor backend
- **JavaScript (ES6+)** — Lógica del frontend (vanilla, sin frameworks)
- **HTML5 / CSS3** — Estructura y estilos

## Frameworks y Librerías
- **FastAPI** — Framework web ASGI para el servidor REST
- **Uvicorn** — Servidor ASGI de alto rendimiento

## Testing
- **pytest** — Tests unitarios del backend Python
- **httpx** — Cliente HTTP para tests de FastAPI (TestClient)

## Herramientas
- **pip** — Gestor de paquetes Python
- **venv** — Virtual environment aislado en `.venv/`
- **bash** — Script de arranque (`run.sh`)
- **localStorage (Web API)** — Persistencia en cliente para historial de rutas recientes y favoritos
