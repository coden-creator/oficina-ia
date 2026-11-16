# Oficina de Jorge: coordinación y contenido

Entrega del 16 de noviembre de 2026. La autorización vigente es desarrollar la oficina; Jorge avisará cuándo ejecutar la prueba después de configurar ElevenLabs. Guardar una clave no activa producción.

## Disponible en esta entrega

- Escritorio con decisiones, solicitudes en marcha y bloqueos de la marca seleccionada.
- Cinco departamentos: Dirección y Contenido tienen funciones de coordinación/preproducción; Comercial, Sistemas y Administración conservan su alcance como próximas etapas. Junie todavía no está conectado.
- Equipo: Jarvis; Valeria; Mateo; Nico; Lucía, Bruno e Inés; Control. La escena y el listado accesible consultan `GET /api/office/:brand`. No inventan chats, actividad ni métricas. La animación de trabajo depende de un estado registrado, y respeta pausa y movimiento reducido.
- Contrato `organic-v1`: análisis de fuentes aportadas y hasta tres ángulos, estrategia, narración/storyboard, seis criterios editoriales y dirección de arte con cuadros clave. El trabajador sigue usando la cuenta ChatGPT mediante el socket privado. No dispone de navegación externa ni herramientas de ejecución.
- El comité pide hasta dos correcciones automáticas, conservando versiones. La regla editorial es total >=42/60 y ninguna nota <6; es un criterio interno revisable, no una probabilidad de viralidad ni una autorización de publicación. Solo un pase entra a edición; rechazo o correcciones agotadas vuelven como decisión pendiente.
- El coordinador ordena correcciones primero y propuestas seleccionadas por puntuación. Reserva tres piezas distintas para tres editores. Las llamadas al único Codex se serializan; tres puestos no equivalen a tres modelos ejecutándose a la vez. No hay cola de render comercial activa.
- Las fichas y sus resultados usan el almacenamiento existente. Un reinicio conserva salidas terminadas y marca una inferencia interrumpida para revisar antes de repetirla. No se repiten automáticamente operaciones con resultado incierto.

## Prueba pendiente de Jorge

`OFFICE_AUTONOMY_ENABLED` permanece desactivado y `OFFICE_AUTONOMY_JOB_IDS` vacío. Ambos se necesitan para procesar fichas específicas: activar un indicador sin IDs no ejecuta toda la bandeja histórica. La ruta manual de una solicitud normal también respeta esta espera. No hay llamadas de voz ni gasto por guardar/configurar la clave. La publicación sigue deshabilitada.

Cuando Jorge avise, verificar el alcance concreto de esa prueba y sus recursos. El control de CPU/memoria del coordinador pausa nuevas reservas al 70% del host; los límites existentes de contenedor permanecen. Esta comprobación no limita a los demás servicios del VPS.

## Límites de producción que siguen abiertos

El contrato nuevo prepara guion y dirección visual. Todavía falta conectar narración autorizada y alineación, escenas y montaje al nivel de las referencias, mezcla y QA audiovisual. Al llegar a producción, la ficha conserva la preproducción y espera esa integración; nunca sustituye el resultado por las tarjetas del render de diagnóstico. La cuenta ElevenLabs por sí sola no completa ese motor.

También quedan investigación externa con fuentes verificables, generación de lotes de propuestas con ranking entre sus variantes, reposición por reserva, métricas reales y programación autorizada. El ranking actual ordena las solicitudes individuales que pasan el comité; no fabrica campañas ni cuotas diarias. La función de QA tiene un puesto definido, pero no informa una revisión audiovisual realizada sin exportación y evidencia.

## Validación local

Especialistas y proveedores se simulan de forma explícita. Se prueban: espera sin inferencia, contratos tipados, correcciones limitadas, conservación de versiones, tres reservas distintas, prioridad de correcciones, pausa por recursos, recuperación sin repetición, exclusión de ejecución duplicada y API autenticada por marca. Chromium verifica las rutas, marca única, borradores, decisiones sobre archivos sintéticos, estados del equipo, inspector, móvil, teclado y movimiento reducido. Nada de esto sustituye una prueba real de producción.
