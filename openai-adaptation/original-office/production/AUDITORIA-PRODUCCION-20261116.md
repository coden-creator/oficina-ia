# Auditoría de la producción de Glowfy

16 de noviembre de 2026 · America/Guatemala.

Jorge rechazó las tres piezas dirigidas por repetir animaciones y efectos. La causa principal es nuestra implementación: un especialista de texto elige parámetros de una plantilla que no puede construir escenas nuevas ni inspeccionar su resultado. Un comité de guion y un MP4 técnicamente válido no cumplieron el nivel visual solicitado.

Se estudió el paquete Motion Video Director 3.5.2 aportado por Jorge: entrada, guías, scripts, plantillas, licencia y alcance de las pruebas declaradas. Se ejecutó el inventario local de solo lectura y se contrastó el método con el código actual. El paquete se mantiene privado fuera del repositorio. Esta auditoría y los cambios de proyecto son propios; no redistribuyen el plugin. Leerlo aquí no significa que el trabajador de Codex lo tenga instalado o pueda ejecutar sus herramientas.

## Evidencia del lote entregado

| Pieza | Versión | Planos con todos los objetos en `rest` | Tiempo de esos planos | Teléfono presente |
|---|---:|---:|---:|---:|
| Una mesa, tres funciones | 4 | 4 de 7 | 53,5% | 6 de 7 |
| Del otro lado del salón | 5 | 5 de 7 | 75,6% | 7 de 7 |
| Después del último detalle | 4 | 3 de 7 | 44,5% | 7 de 7 |

Estos son cálculos del plan asociado al archivo, no una puntuación estética ni una medición de inmovilidad de píxeles: todavía pueden moverse la cámara, las entradas y los subtítulos. Las hojas de cuadros confirman composiciones y recursos repetidos. Las tres fichas carecían de revisión audiovisual registrada, aunque sí tenían control técnico. Los IDs, versiones y hashes están en la [evidencia](evidence/mvd-production-audit-20261116.json).

## Causas verificadas

| Causa | Código comprobado | Consecuencia |
|---|---|---|
| Repertorio cerrado | `video/motion-contract.mjs`: 12 objetos, 4 escenarios, 6–8 planos, exactamente 4 escenas narradas | Una balanza, una bandeja de correo funcional o un equipo coordinado no caben en el contrato. |
| Composición casi fija | `production/glowfy/scene-directed.mjs`: objetos recortados a y=520–1325, mismo logo, titulares y subtítulos | Las diferencias del concepto se diluyen en el mismo escenario. |
| Cámaras nominales | En el mismo compositor, `orbit` y `overhead` aplican rotación/escala 2D | Sus nombres no acreditan órbita espacial ni vista cenital. Exigir tres nombres de cámara no garantiza variedad. |
| Pocas acciones internas | `rest`, `reveal`, `turn`, `withdraw`, `open`, `draw` y dibujantes fijos | Es sencillo mover el objeto, pero no construir una interacción específica dentro de él. |
| Montaje mecánico | `production/glowfy/directed-plan.mjs` divide cada escena de voz en partes iguales | El momento del corte no lo decide una acción o una palabra concreta. |
| Sonido poco expresivo | Contrato de 1–3 sonidos por plano, ocho IDs; `directedSoundCues` calcula porcentajes | No existe silencio explícito por evento ni ancla obligatoria entre contacto visual y transitorio del sonido. Los textos de intención no se ejecutan. |
| Editor sin herramientas de producción | `codex/organic-specialist.mjs`, `chatgpt-runtime.mjs`, `text-only-config.mjs` | El trabajador redacta JSON; shell, archivos de proyecto, imágenes, plugins y herramientas de edición están desactivados. No está usando el proceso de edición del plugin. |
| Revisión del resultado desconectada | `production/glowfy-production.mjs` comprueba códec, dimensiones, duración, decodificación y mezcla; `organic-workflow.mjs` entrega después | No hay un ciclo interno que mire el render, detecte fallos narrativos/visuales y lo rehaga. |
| Memoria incompleta | `video/audiovisual-standard.mjs` enviaba concepto/dirección, omitiendo revisiones y aceptación | Un archivo malo podía volver al contexto como inspiración sin su crítica. Corregido en esta intervención. |
| Documentación desactualizada | `production/glowfy/PROGRESS.md` seguía describiendo el piloto anterior | Se actualizó el estado y se incorporó el rechazo a `TASTE.md` y `LOG.md`. Eso no instala por sí solo una skill en el runtime. |

La biblioteca sí contiene música y efectos elegidos por Jorge. El problema no se resuelve contratando otro modelo ni regenerando sonidos indiscriminadamente: falta dirección de escenas y de eventos. La escucha subjetiva no se realizó en esta auditoría y no se simula mediante una lectura de LUFS.

## Qué enseñan las cinco referencias de Jorge

Los tiempos son aproximaciones de las hojas de cuadros; no se publican ni reutilizan los archivos de referencia en entregables.

| Archivo | Acción visual observada | Aprendizaje para Glowfy |
|---|---|---|
| `Final 2026-11-15-16-32.mp4` | Un sistema se construye por módulos y luego pasa a varios dispositivos/equipo | Mostrar un cambio de estado y su consecuencia; las pantallas deben tener contenido que explique algo. |
| `Final 2026-11-15-16-47.mp4` | Chats personales se desprenden, el teléfono se vacía y aparece el entorno de empresa | La misma familia de objetos puede contar otra historia cuando cambia su comportamiento. |
| `Final 2026-11-15-17-56 (1).mp4` | 0–6 s: bandeja de correo; 6–9 s: selección y apertura; 9–16 s: firma que se completa; 16–19 s: vuelta al escritorio | La cámara acompaña el objetivo del cursor y se detiene para leer. Jerarquía, interfaz y acción permanecen conectadas. |
| `Final 2026-11-15-17-56.mp4` | Balanza con Facebook y web; 3,5–8 s: acercamiento, sello, candado y alcance; luego contraparte y regreso al conjunto | Una metáfora visual propia sostiene el video entero. Materiales, peso y relaciones entre objetos comunican la idea. |
| `Final 2026-11-15-17-42.mp4` | Preguntas que se escriben y despliegan respuestas; 11–15 s: lista de diez; 15,5–18,5 s: transición al equipo usando respuestas | Transformar información en una situación visible; usar continuidad espacial para explicar el beneficio. |

Se analizaron los tres nuevos videos completos en ventanas de hasta 12 s a 4 fps, con los primeros 3 s a 30 fps. Se inspeccionaron panoramas de toda la duración y secuencias densas de las acciones señaladas. No se infiere qué programa, modelo 3D o técnica de origen se utilizó solamente por su apariencia.

**La lección no es prohibir teléfonos o añadir más cortes.** Las referencias mantienen objetos durante varios segundos, reutilizan tipografía y marca, y aun así cuentan historias distintas. No imponer un porcentaje de cambio de cámara, un mínimo de fondos o un efecto por segundo como sustituto del criterio visual. Conservar la identidad Glowfy; no copiar el rojo, las afirmaciones ni la voz de Cresova.

## Corrección aplicada ahora

- Registradas observaciones negativas de historia, acabado, movimiento, sonido y variedad en las tres versiones/hash exactos. Voz marcada como no escuchada en esta auditoría. No se descartaron archivos ni se activaron nuevos renders.
- El contexto de los especialistas incluye la revisión exacta, sus correcciones pendientes y lo que no fue evaluado. Diferencia referencia negativa, ejemplo no revisado, concepto sin video y aceptación del propietario.
- Una revisión vieja no califica una versión nueva; un control interno favorable no se convierte en aprobación de Jorge. Se priorizan las críticas recientes dentro del presupuesto de contexto y se mantiene la separación de marcas.
- Pruebas locales: 31 casos pertinentes pasados, sin proveedores reales. Esto verifica la transmisión de la crítica; no acredita que el siguiente video sea bueno.

## Implementación que falta para producir con el nivel solicitado

1. **Proyecto editable por pieza.** Conservar el activador y el equipo, pero dar a edición un espacio privado con recursos autorizados, memoria de Glowfy, referencias visuales y archivos de escena propios. El esquema de 12 objetos queda para reproducciones históricas, no como techo de producción nueva.
2. **Edición con acciones reales.** El agente debe poder construir composición, interfaz y coreografía por proyecto, ejecutar previews y recibir sus imágenes. Usar Canvas/SVG y el renderer determinista existente donde sirva; habilitar 3D o recursos externos únicamente si la escena lo necesita y la capacidad está comprobada. No sustituir el problema por tres nuevas plantillas.
3. **Tiempos ligados a eventos.** Mantener el máster de voz y su alineación; programar contactos, lectura, transiciones y resolución musical sobre eventos concretos. Permitir pausas y silencio motivado. La biblioteca ya elegida es reutilizable.
4. **Revisión interna con evidencia visual.** Comparar el gancho, las acciones completas y el cierre con las referencias y las últimas piezas. Corregir dentro de la oficina. Una casilla rellenada por el mismo guionista no constituye revisión del render.
5. **Entrega final.** Pasar calidad técnica y revisión audiovisual interna antes de presentar el video terminado a Jorge. Su pedido explícito elimina aprobaciones intermedias de guion/plan/preview; publicación y programación conservan su autorización aparte.

La ejecución de escenas nuevas requiere un entorno de render separado del proceso que conserva la sesión de Codex y de las conexiones privadas. Se deben mantener ≤5 CPU asignadas en total, control global de CPU/RAM <70%, un render simultáneo y preservación de versiones. No hace falta abrir el VPS entero ni habilitar APIs de pago para estudiar o construir esa ruta. Todavía no está implementada ni validada en producción; el cambio de historial no se presenta como su sustituto.
