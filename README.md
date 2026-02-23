# visor_fotos

## Descripción del Proyecto

Aplicación web de ejecución **local** (no requiere servidor remoto ni backend en la nube). Su función es ser un **visor de fotos en pantalla completa** con las siguientes características:

- **Fuente de datos**: Un directorio local del sistema de archivos del usuario que contiene archivos de imagen (JPEG, PNG, etc.).
- **Orden de visualización**: Las fotos se presentan en orden alfabético por nombre de archivo, en un ciclo continuo e infinito.
- **Transiciones**: Se utiliza **morphing** como efecto de transición entre cada foto. El efecto debe ser suave y visualmente atractivo.
- **Prioridad técnica**: Máxima **fluidez y velocidad** de renderizado. Minimizar latencia entre imágenes y cualquier artefacto visual.

## Arquitectura Esperada

- Aplicación web estática (HTML + CSS + JS puro, o con un servidor web local mínimo si es necesario para acceder al sistema de archivos).
- No requiere base de datos ni autenticación.
- El usuario configura el directorio de fotos de alguna forma simple (ej: input de texto, drag & drop, o parámetro en la URL/configuración).

---

## Reglas para el Agente de IA

Este documento define las directrices y convenciones de desarrollo para este repositorio:

1. **Registro de Cambios**: Documentar cualquier modificación significativa en el archivo `log.md`.
2. **Actualización del Stack**: Mantener `technical_stack.md` al día, registrando inmediatamente cualquier nueva tecnología o herramienta incorporada.
3. **Autonomía y Velocidad**: 
   * El agente tiene autonomía total para tomar decisiones de diseño sin consulta previa, priorizando la agilidad y el avance rápido del proyecto.
   * **Implementación en dos pasos**: Si el usuario pide un cambio o mejora, el agente primero explica la estrategia y la registra en el archivo de sesión (`planning/`). Solo tras la confirmación del usuario o en un prompt posterior, el agente procede a implementar lo que esté marcado como incompleto.
4. **Planificación**: 
   * Cualquier implementación requiere que el plan o mejora ya esté descrita en la sesión activa. 
   * El agente debe revisar si hay un plan activo en `planning/` y continuar desde el último checklist no completado. Si no existe, debe crearlo con nombre `planning/session-YYYY-MM-DD.md`. Buscar en los últimos tres archivos de planificación (orden cronológico).
5. **Unit Tests**: Todo código Python del backend debe tener tests unitarios con `pytest` en el directorio `tests/`. Los tests deben ejecutarse y pasar antes de dar una fase por completada.
6. **Documentación**: Mantener documentación actualizada en `docs/`. Agregar docstrings a funciones Python y JSDoc a funciones JavaScript. Cada componente nuevo debe documentarse antes de pasar a la siguiente fase.
7. **Bugfixes y Mejoras**: Todo bugfix o feature que surja fuera del plan original debe registrarse en el `session-YYYY-MM-DD.md` activo bajo las secciones `## Bugfixes` y `## Mejoras`, con síntoma, causa, fix e ítems completados.
8. **Cambios de Documentación y Reglas**: Las actualizaciones de documentación (`docs/`, `README.md`, `technical_stack.md`, etc.) y de reglas del agente **no** requieren entrada en `planning/`. Solo deben registrarse en `log.md`.
9. **Cierre de Sesión con Introspección**: Toda sesión debe cerrarse con una sección `## Introspección de la Sesión` en el archivo `session-*.md` activo. El agente redacta la propuesta inicial; luego el PM incorpora sus propias reflexiones (*reflection-on-action*, Schön). La introspección debe contener las siguientes subsecciones:
   - **TL;DR**: Métricas duras y la idea central de la sesión en 2-3 líneas.
   - **Cadena de decisiones**: Diagrama o lista de las macro-decisiones y sus derivaciones (bugs, mejoras, meta-mejoras).
   - **Micro-decisiones clave**: Tabla con las decisiones pequeñas que resultaron determinantes (contexto → impacto).
   - **Sorpresas**: Qué supuestos se invalidaron y por qué, con contexto suficiente para entender la causa.
   - **Aprendizajes**: 1-3 lecciones con *implicancia* explícita (qué cambiar en el futuro).
   - **Reflexiones del PM**: Observaciones del humano no capturadas por el agente (puntos ciegos, ajustes de proceso, deudas).
   - **Métricas**: Tabla con dimensiones clave (archivos, líneas, tests, bugs, mejoras, reglas).
   - **Deudas abiertas**: Checkboxes con problemas identificados pero no resueltos.
   
   **Tono**: compacto pero con desarrollo suficiente para que un humano o IA pueda extrapolar las ideas rápidamente y sin dificultad. Evitar tanto la verbosidad excesiva como la compresión críptica.
10. **Nomenclatura Estándar**: Bugfixes se identifican como `BF-XX` y mejoras como `M-XX` (numeración secuencial por sesión). Esta nomenclatura debe usarse consistentemente en `session-*.md`, `log.md` y commits.
11. **Horario de Sesión**: Todo archivo `session-*.md` debe registrar en su encabezado la **hora de inicio** y la **hora de término** de la sesión (formato `HH:MM`, zona horaria local). La hora de inicio se registra al crear el archivo; la hora de término se actualiza al cerrar la sesión (antes de la introspección).