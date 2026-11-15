# Revisión de interfaz: selección de marca

Pedido de Jorge: corregir duplicación y mal diseño en la interfaz existente. No sustituirlo por una propuesta de navegación nueva.

## Hallazgos

- `public/navigation.js`: selector global, tarjetas de marcas que también seleccionan y repetición del contexto en la barra lateral.
- `public/video-panel.js`: segundo selector independiente dentro del formulario; sincronización manual entre dos estados.
- `public/compat.css`: estilos separados para presentar la misma decisión de varias formas y reglas duplicadas para móvil.

## Plan visual antes de implementar

Se conserva la identidad oscura y la navegación actual. La intervención se concentra en un control reconocible, a la derecha de la identidad de la oficina. El formulario hereda ese contexto.

```text
Escritorio: [Oficina]  [Marca / Glowfy ▾]                    [fecha]
            navegación       contenido de la sección

Móvil:      [Oficina]  [Marca / Glowfy ▾]
            navegación y contenido
```

Paleta tomada de la interfaz: fondo `#0d0e12`, superficie `#15171d`, borde `#3b4150`, texto `#eef0f5`, secundario `#adb4c3`, foco `#b7a3ff`. Una tipografía heredada del sistema existente; etiqueta de 12 px, valor de 15 px, área táctil mayor de 44 px. Alineación izquierda, separación 8/16/24 px. No se descargan fuentes ni se añaden logos, gradientes, tarjetas de selección o animaciones.

Revisión del plan: inicialmente se planteó una maqueta más amplia. Se descarta ese alcance tras la aclaración de Jorge. El cambio útil es eliminar decisiones duplicadas y definir un contexto único, no decorar tres controles existentes.

## Comportamiento requerido

- Un único control visible y accesible para cambiar marca en cualquier ruta.
- El Estudio usa esa marca sin pedir seleccionarla de nuevo.
- Marcas conserva su función informativa; no ofrece otro selector.
- La selección se conserva entre rutas y al recargar mediante `?brand=...`.
- Con un borrador, cancelar el cambio conserva selección y campos. Aceptarlo limpia el borrador antes de cargar la nueva marca.
- Durante una operación, el selector queda temporalmente deshabilitado.
- Respuestas atrasadas y carga de archivos no pueden cruzar marcas, incluso si se vuelve rápidamente a la marca anterior.

## Skills incorporadas

- Anthropic `frontend-design`: dirección visual, jerarquía y autocrítica.
- Vercel `web-design-guidelines`: accesibilidad, interacción, formularios y revisión de código.

Instaladas para Codex dentro de `.agents/skills/`, con procedencia en `skills-lock.json`. Las instrucciones locales de `public/AGENTS.md` indican su aplicación en futuras modificaciones. No se han activado servicios de pago.

## Validación de esta revisión

- 32 pruebas Node aprobadas: navegación y estado compartido, empaquetado, shell autenticado, flujo HTTP, importación de material y Conexiones.
- Chromium a 1440, 390 y 320 px: un solo selector, sin desbordamiento horizontal, control de 56 px de alto y operación por teclado.
- Navegar y recargar conserva marca; cancelar el cambio conserva borrador; aceptarlo lo limpia. Una respuesta atrasada no cambia la marca visible. Guardar bloquea temporalmente el selector y envía la solicitud a la marca correcta.
- Capturas de escritorio y móvil inspeccionadas. Proveedores sin conexión en el entorno de prueba; no hubo inferencia, voz ni publicación.
- Cambios preparados en la rama de revisión, pendientes de desplegar.

## Alcance pendiente de la revisión de interfaz

- `public/video-panel.js:31` — el bloque de disponibilidad sigue siendo extenso y algunos estados internos aparecen en inglés. Requiere otra intervención de contenido y jerarquía; no se presenta toda la interfaz como rediseñada.
- `public/navigation.js:11` y `public/compat.css:75` — selector unificado, nombre accesible, foco visible, estado deshabilitado y presentación móvil revisados.
