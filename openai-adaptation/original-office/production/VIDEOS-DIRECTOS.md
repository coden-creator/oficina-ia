# Entrega directa de videos · Glowfy

Jorge aclaró el 16 de noviembre de 2026 que quiere revisar únicamente el video terminado. El pedido anterior de ideas no debe convertirse en una aprobación obligatoria de guiones. La oficina conserva internamente investigación, estrategia, guion, comité, arte y montaje; entrega el MP4 pendiente de la aprobación de Jorge. Publicación y programación siguen separadas y deshabilitadas.

El activador `POST /api/video-workflows/glowfy/:id/produce` con versión convierte una idea existente una sola vez, conserva su historial y el concepto, y registra el cambio de alcance. Requiere el ID exacto en `OFFICE_DIRECTED_VIDEO_JOB_IDS`; no activa otras piezas históricas. Los especialistas Codex reescriben la narración para la entrega audiovisual, revisan y producen el plan de edición. El operador no inserta guiones ni planes de montaje en las fichas.

El contrato `glowfy-directed-motion-v1` agrega una etapa `edit_plan`: el editor selecciona 6–8 planos, composiciones, objetos, entradas/acciones, cámara, música y contactos sonoros. Un motor Canvas de vocabulario limitado ejecuta esos datos; no ejecuta código generado. Es ilustración 2.5D, no rodaje ni generación arbitraria de escenas. Hay tres reservas de editor y un solo render a la vez. No se afirma equivalencia estética con las referencias por pasar las pruebas.

Narración: cuatro escenas, hasta 440 caracteres, voz existente autorizada; una solicitud durable por versión, cuenta ElevenLabs con saldo incluido suficiente y cobro adicional deshabilitado. Resultado incierto nunca se repite. Música A/B/C/D y efectos revisados de la biblioteca de Jorge. Tiempos de imagen, subtítulos y sonidos parten de la alineación real de voz. La mezcla y el archivo final se verifican con FFmpeg/ffprobe; las medidas no sustituyen la revisión audiovisual ni la aprobación del dueño.

Para el nuevo alcance se conservan las versiones de ideas y se inicia un ciclo editorial limitado a tres correcciones, con contrato explícito de cuatro escenas. El rechazo o el límite no se falsean como aprobación. El contador anterior de ideas permanece en su historial. No se reinician correcciones por simples reintentos de red.

Preparación comprobada localmente: pruebas de promoción idempotente, exclusión de otras piezas, etapa editorial hasta producción, validación del plan, alineación y render determinista; regresiones de oficina, voz, HTTP y empaquetado. Los datos de prueba son sintéticos. La ejecución de las tres fichas reales se registra separadamente después de activarlas.

Revisión del primer archivo: se detectaron rótulos por defecto cuando el editor pedía mensajes abstractos y una CTA duplicada. El motor respeta ahora text vacío y muestra un único cierre; la ruta autenticada /rerender guarda la versión anterior y exige reutilizar la narración exacta en caché, sin síntesis ni consulta del proveedor. El contrato del editor explicita tres cámaras y dos ambientes para evitar respuestas que luego incumplan su validación.

## Ejecución real

Las tres fichas completaron guion, comité, dirección, montaje, ElevenLabs y render en la oficina. Entregas actuales: primera v4 (24,10 s), segunda v5 (21,13 s), tercera v4 (22,73 s). Las dos primeras conservan la narración generada antes de la corrección del render; la tercera completó el montaje tras explicitar el criterio de diversidad. Tres MP4 1080×1920/30 fps, AAC, control técnico aprobado y SHA-256 de descarga comprobado. Se revisaron hojas de cuadros de los tres archivos; la escucha subjetiva y la aprobación comercial siguen siendo del propietario. [Evidencia](evidence/glowfy-office-videos-20261116.json).
