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