# Recuperación del departamento de contenido orgánico

Revisión del código original: 15 de noviembre de 2026. El departamento es el objetivo del producto; el formulario de solicitudes individuales no lo sustituye.

## Lo que ya hacía el original

| Responsable | Trabajo y evidencia en el repositorio |
| --- | --- |
| Valeria (`estratega`) | Investigación, informe de rendimiento y brief para guiones. `prompts/estratega.md`, `investigacion.mjs`, `reuniones.mjs`. Fuentes identificadas, análisis de publicaciones con al menos 48 horas, experimentos y manual de aprendizaje. |
| Mateo (`guionista`) | Lotes de ideas y guiones, titular desde el cuadro inicial, locución, storyboard de 4–6 escenas, CTA y texto de publicación. `prompts/guionista.md`. Reparto original 70% explotar / 30% explorar, sujeto a tener ganadores reales. |
| Nico (`viralidad`) | Seis notas de 0–10; PASA con total ≥45/60 y ninguna nota <6; CAMBIOS o DESCARTA con explicación. Ranking antes de producir. `prompts/viralidad.md`, herramienta `encolar_video` en `runner.mjs`. |
| Lucía, Bruno e Inés (`video`, `video2`, `video3`) | Hasta tres trabajos de edición simultáneos, carpeta reservada por editor, correcciones prioritarias y reanudación. `agents.mjs`, `linea.mjs`. Preparan voz, tiempos, escenas, mezcla y vistas previas; el render final tiene su propia cola. |
| Jorge | Videos terminados en su bandeja: aprobar, pedir cambios o descartar la idea. La aprobación debe identificar la versión exacta. |
| Community | Calendario y publicación únicamente de piezas aprobadas y con el alcance autorizado por Jorge. `publicador.mjs`, `prompts/community.md` contienen la implementación original que hay que adaptar. |

`linea.mjs` conserva reserva, tamaño del lote, límite diario, ocupación por editor, cola y reintentos. Prioriza las correcciones del dueño; evita repetir trabajos; reanuda lo interrumpido. No es solamente un conjunto de prompts ni una animación de agentes.

Los criterios originales de Nico son: gancho visible en cuadro 0; mensaje antes de 2 segundos comprensible sin audio; problema y destinatario claros; cambio visible antes de 3 segundos; novedad frente al historial; reglas de marca, evidencia y CTA. Las reglas comerciales de Cresova se reemplazan por las de cada marca, nunca se copian sus ofertas, números, identidad o permisos.

## Qué se perdió en la adaptación

`server.mjs` no importa el backend original. `public/compat-app.js` conserva el escenario, pero desactiva sus acciones y no carga `public/app.js`. `video/video-flow.mjs` introdujo otro circuito de solicitudes individuales, con una exclusión global durante cada ejecución. `codex/video-specialist.mjs` usa un trabajador sin navegación ni herramientas y un contrato de tarjetas. Por tanto:

- Los personajes visibles no prueban que esos agentes estén trabajando.
- “Research” analiza exclusivamente evidencia aportada; no investiga tendencias en internet.
- La revisión creativa actual no implementa las seis notas ni el ranking del comité.
- No hay reposición de ideas por reserva ni tres editores conectados.
- El render de diagnóstico no cumple las referencias audiovisuales de Jorge.
- El calendario y las cuentas de publicación aún no están conectados.

La conexión de la cuenta Codex y una prueba de render son avances técnicos, pero no equivalen al departamento terminado.

## Implementación que hay que recuperar, por dependencias

1. **Memoria y fuentes por marca.** Brief, hechos comprobados, referencias audiovisuales, historial de ideas y correcciones. Investigación con fuentes/fechas verificables; si falta un conector, declararlo. No inventar métricas ni ganadores para cumplir la proporción 70/30.
2. **Guiones y comité.** Recuperar storyboard, locución y publicación; sustituir el contrato de tarjetas de diagnóstico. Guardar seis notas, correcciones y ranking. El código debe rechazar un PASA que no cumpla el umbral. Nico puede pedir correcciones a Mateo sin trasladar la tarea a Jorge.
3. **Cola persistente y tres editores.** Recuperar las reglas de `linea.mjs` adaptadas al ejecutor Codex, sin importar su runtime Claude, credenciales ni automatismos. Reserva atómica por trabajo/editor, correcciones prioritarias, reanudación tras reinicio y deduplicación. Los tres editores pueden preparar piezas distintas; el render se admite por capacidad real del VPS. Tener tres nombres en pantalla no cuenta como paralelismo.
4. **Producción audiovisual.** Cada editor trabaja con `ESTANDAR-AUDIOVISUAL.md`: escenas, voz autorizada y alineada, mezcla y revisión de imágenes. Reutilizar material ya válido al corregir. La pantalla de claves de ElevenLabs guarda/verifica acceso; no autoriza por sí sola generar voz ni gastar créditos.
5. **Bandeja de Jorge.** Mostrar video, versión, marca, criterio del comité y estado real. Aprobar esa versión, pedir cambios que vuelven al editor o descartar con motivo e historial. El descarte ya se añade al flujo de solicitudes en esta revisión; el regreso automático al editor depende de la cola del punto 3.
6. **Calendario y publicación.** La aprobación del video y la orden de programarlo deben tener alcance explícito: cuenta, canal, fecha y versión. Una corrección invalida aprobaciones anteriores. El modo `organicoAuto` del original NO se hereda: allí podía publicar sin revisión individual, contrario a la regla de Jorge.
7. **Aprendizaje.** Con resultados reales, Valeria y Nico comparan notas con retención y revisan el manual por marca. No hay datos de rendimiento inventados ni publicación automática para conseguirlos.

## Criterios de aceptación

- Un lote recorre investigación → guiones → comité; solo aprobados por criterio llegan a edición.
- Tres editores reclaman tres trabajos distintos sin repetir una voz, carpeta ni pieza al reiniciar.
- La oficina usa como máximo 5 CPU; pausa nuevas tareas al alcanzar el 70% global del VPS. El número de editores no aumenta esos límites.
- Jorge recibe piezas reproducibles al nivel de referencia y puede aprobar, corregir o descartar sin operar agentes manualmente.
- Una corrección conserva versiones anteriores y entra primero; una idea descartada no se vuelve a producir ni se programa.
- Ningún video se programa/publica sin autorización de Jorge para esa versión y destino.

Esta revisión documenta evidencia y dependencias. No presenta los puntos pendientes como integrados, desplegados ni probados con proveedores reales.
