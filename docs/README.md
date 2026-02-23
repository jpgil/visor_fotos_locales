# visor_fotos — Guía de Usuario

## Requisitos Previos

- **Python 3.9+** instalado.
- Un navegador web moderno (Chrome, Firefox, Safari, Edge).

## Instalación y Ejecución

```bash
# 1. Clonar o descargar el proyecto
cd visor_fotos

# 2. Ejecutar (crea el venv, instala dependencias y abre el navegador)
./run.sh
```

El script crea automáticamente un virtual environment en `.venv/` la primera vez que se ejecuta y lo activa en cada arranque. El navegador se abrirá en `http://localhost:8000`.

### Ejecución manual (alternativa)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --port 8000
```

### Ejecutar los tests

```bash
source .venv/bin/activate
pytest tests/ -v
```

## Uso

1. Ingresa la **ruta absoluta** del directorio con tus fotos (ej: `/Users/tu/fotos/vacaciones`). *Se guardará un historial de tu uso reciente y podrás volver a seleccionarlas con el botón `▾` a la derecha.*
2. Ajusta el **intervalo** entre fotos (1-30 segundos).
3. Elige el **orden**: Alfabético (A→Z) o Aleatorio.
4. Elija la **precarga**: Por defecto está desactivada para permitir mayor velocidad en directorios grandes. Active si es necesario para evitar "saltos" en red/discos lentos.
5. Puedes ingresar una lista de directorios estáticos abriendo la sección de **Directorios favoritos**, los cuales quedarán pre-cargados al historial.
6. Haz clic en **Iniciar**.

## Atajos de Teclado

| Tecla       | Acción                          |
|-------------|---------------------------------|
| `Espacio`   | Pausar / Reanudar               |
| `→`         | Siguiente foto                  |
| `←`         | Foto anterior                   |
| `F`         | Pantalla completa (toggle)      |
| `Escape`    | Salir de fullscreen o volver a configuración |

## Formatos Soportados

JPEG, PNG, GIF, WebP, BMP, TIFF.
