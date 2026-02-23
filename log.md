# Registro de Cambios (log.md)

En este archivo se registrarán los cambios principales realizados en el proyecto `visor_fotos`.

**2026-02-23**
* Inicialización de protocolos. Creación de `README.md` con reglas para la IA y preparación de archivos base (`log.md`, `technical_stack.md`).
* Creación de `planning/session-2026-02-23.md` con plan de implementación detallado (8 fases).
* **Fase 1**: Creación de `server.py` (FastAPI + Uvicorn), `requirements.txt`, `run.sh`.
* **Fase 2**: Creación de `tests/test_server.py` con 13 tests unitarios (todos pasando).
* **Fases 3-6**: Creación del frontend completo: `static/index.html`, `static/style.css`, `static/app.js` con clase `Slideshow` (morphing, precarga, teclado, fullscreen, barra de progreso).
* **Fase 7**: Documentación: `docs/README.md` (guía de usuario), `docs/ARCHITECTURE.md` (diagrama de componentes y decisiones). Docstrings en `server.py`, JSDoc en `app.js`.
* Actualización de `technical_stack.md` y `log.md`.
* **Corrección**: Incorporación de virtual environment (`.venv/`). Actualizado `run.sh` para crearlo y activarlo automáticamente. Creado `.gitignore`. Agregado `tests/conftest.py` para correcta resolución de imports dentro del venv. 13/13 tests pasando en Python 3.14.
* **Bugfix**: `StaticFiles` montado en `/` interceptaba las rutas `/api/foto/...` antes de que FastAPI las manejara, causando 404 en las imágenes. Solución: `StaticFiles` movido a `/static`, `index.html` servido explícitamente en `GET /`. Añadido `[hidden] { display: none !important }` en CSS para corregir override de `display: flex`. Fix en `_loadImage` para imágenes en caché. Slideshow verificado en navegador funcionando.
* `object-fit` cambiado de `cover` a `contain` para que las fotos se vean completas sin recorte.
* Duración de transición morphing reducida de 1.2s a 0.6s.
* Historial de rutas recientes con `localStorage` (max 8, dropdown con borrado individual, pre-carga de última ruta).
* Agregada sección de "Favoritos" en la UI y precarga desactivada por defecto.
* **BF-02**: Dropdown corregido: scroll habilitado (`max-height: 240px`, `overflow-y: auto`), favoritos siempre visibles en la lista (sin límite de 8), marcados con ★ y sin botón de borrar.
* **BF-03**: Dropdown desbordaba el viewport. Fix: `position: absolute` en `.recent-dirs` + movido dentro de `.dir-input-wrapper` (que ya tiene `position: relative`) para que flote correctamente sobre el contenido.
* **Mejora de Reglas**: Agregada regla 8 — los cambios de documentación y reglas solo van al `log.md`, no a `planning/`.
* **Documentación**: Corregidos `docs/ARCHITECTURE.md` (flujo de datos actualizado: precarga opcional, transición 0.6s, dropdown `position: absolute`), `docs/README.md` (guía de uso actualizada) y `technical_stack.md` (agregado `localStorage`).
* **Mejora de Reglas**: Actualizado `README.md` para establecer el proceso de implementación en dos pasos (planificación obligatoria -> revisión -> implementación).
* **Introspección**: Agregada sección "Introspección de la Sesión" en `planning/session-2026-02-23.md` — análisis retrospectivo de la cadena de decisiones, sorpresas, 3 aprendizajes principales, y evaluación del proceso a través de la racionalidad limitada de Herbert Simon.
* **Introspección v2**: Compactada introspección a mínimo viable. Incorporadas reflexiones del PM (Schön, reflection-on-action): optimización de tokens, deuda de granularidad log↔sesión, nomenclatura BF/M como regla, principio de compresión documental.
* **Reglas 9-10**: Agregadas regla 9 (introspección obligatoria al cierre de sesión, agente propone → PM enriquece) y regla 10 (nomenclatura estándar BF-XX/M-XX).
* **Deuda registrada**: Granularidad `log.md` vs `session-*.md` pendiente de definir.
