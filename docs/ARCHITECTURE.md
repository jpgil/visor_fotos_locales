# Arquitectura — visor_fotos

## Diagrama de Componentes

```
┌──────────────────────────────────────────────┐
│                   Navegador                   │
│                                               │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │ index.html  │  │      app.js          │   │
│  │ style.css   │  │  ┌────────────────┐  │   │
│  │             │  │  │   Slideshow    │  │   │
│  │ Config  ◄───┼──┤  │  - precarga    │  │   │
│  │ Screen      │  │  │  - morphing    │  │   │
│  │             │  │  │  - teclado     │  │   │
│  │ Slideshow ◄─┼──┤  │  - timer       │  │   │
│  │ View        │  │  └────────────────┘  │   │
│  └─────────────┘  └──────────┬───────────┘   │
│                               │ fetch()       │
└───────────────────────────────┼───────────────┘
                                │ HTTP
┌───────────────────────────────┼───────────────┐
│              server.py (FastAPI)              │
│                               │               │
│  GET /api/fotos?dir=...  ◄────┘               │
│  GET /api/foto/{name}?dir=...                 │
│  GET / (static files)                         │
│                                               │
│  list_image_files(dir) → [str]                │
│  ┌─ Valida directorio                         │
│  ├─ Filtra por extensión                      │
│  └─ Ordena alfabéticamente                    │
│                                               │
│  Seguridad: Path traversal protection         │
└───────────────────────────────────────────────┘
         │
         ▼ FileSystem
    /ruta/a/fotos/
    ├── alpha.jpg
    ├── beta.png
    └── ...
```

## Flujo de Datos

1. **Inicio**: Usuario ingresa directorio → `Slideshow.init()`.
2. **Listado**: `app.js` llama `GET /api/fotos?dir=X` → `server.py` escanea el directorio, filtra por extensión, ordena, retorna JSON.
3. **Visualización**: `app.js` carga la primera imagen en layer A. Si la precarga está activa, pre-carga N+1 y N+2 en background.
4. **Transición**: timer dispara `showNext()` → aplica `morph-out` a layer activo, `morph-in` al entrante (0.6s, blur+scale+opacity).
5. **Ciclo**: al llegar al final del array, vuelve al índice 0.

## Decisiones Técnicas

| Decisión | Rationale |
|----------|-----------|
| FastAPI + Uvicorn | Rendimiento ASGI, endpoints simples, servicio de estáticos integrado. |
| JS vanilla (sin frameworks) | Máximo rendimiento, sin overhead de virtual DOM. Aplicación simple. |
| Precarga opcional de N+1 y N+2 | Configurable por el usuario. Elimina latencia en discos lentos; desactivada por defecto para mayor velocidad con carpetas grandes. |
| CSS keyframes para morphing (0.6s) | GPU-acelerado (`will-change`, `transform`, `filter`). 60fps sin canvas. |
| Cache con cleanup (max 3 cercanas) | Evita memory leaks con muchas imágenes. |
| Path traversal protection | Seguridad: resuelve paths y verifica que estén dentro del directorio base. |
| Almacenamiento Local (localStorage) | Persistencia de historial de rutas y favoritos puramente en el cliente. |
| Dropdown con `position: absolute` | El menú de rutas recientes flota sobre el contenido (BF-03) sin alterar el flujo del layout. |
