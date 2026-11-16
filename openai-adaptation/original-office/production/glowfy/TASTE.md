# Glowfy · revisión audiovisual solicitada por Jorge

## Corrección vigente · 16 de noviembre de 2026 · lote rechazado

Jorge rechazó «Una mesa, tres funciones» v4, «Del otro lado del salón» v5 y «Después del último detalle» v4 por repetir animaciones y efectos. Son referencias negativas; su control técnico aprobado no valida el resultado artístico. La configuración del motor dirigido v1, incluido su escenario central fijo, no es estilo aprobado. Las notas de producciones anteriores que siguen debajo son historia, no una plantilla obligatoria.

Jorge quiere revisar únicamente el video terminado. La oficina debe resolver investigación, guion, dirección, edición, revisión interna y correcciones antes de entregarlo. No agregar aprobaciones intermedias de guion, storyboard o preview. La decisión final sobre cada versión, y la autorización de publicación/programación, siguen siendo suyas.

La identidad moderna, cálida y elegante, los recursos musicales elegidos y la voz existente se conservan. Lo que debe variar es lo que ocurre: concepto, acción, objetos que interactúan, composición, ritmo y sonido. Un cambio de texto, fondo o zoom no demuestra variedad. Reutilizar un objeto está permitido cuando la acción y la función narrativa lo justifican; no imponer un catálogo cerrado como límite de producción. Las referencias de Cresova orientan el nivel de detalle y las técnicas, no transfieren colores, afirmaciones comerciales, voz ni permisos de activos a Glowfy.

La crítica debe quedar vinculada al hash y versión revisados y entrar al contexto de los especialistas. No describir un archivo exportado como referencia aprobada, ni un análisis textual como inspección de imagen o escucha. Ver `../AUDITORIA-PRODUCCION-20261116.md` para límites observados y la ruta de corrección.

La primera exportación pasó las comprobaciones técnicas y Jorge la rechazó: sin música, efectos casi imperceptibles, planos largos y voz plana. Los dos videos aportados siguen siendo la referencia mínima; resolución, score del guion y decodificación no prueban calidad estética.

Dirección adoptada de `estudio-video/TASTE.md`, `scripts/voz_tomas.mjs` y `scripts/mezcla.mjs`: frases cortas, aproximadamente 40–50 palabras; acción completa desde el primer cuadro; cámara que conecta objetos; acciones visibles en la conversación y la reserva; música con desarrollo y efectos que acompañen contactos. No usar un zoom sobre una lámina como sustituto de animación.

Pipeline Canvas determinista y FFmpeg, 1080×1920 a 30 fps; un render simultáneo. Marca Glowfy, logo oficial de getglowfy.com, violeta y berenjena, Montserrat e Instrument Serif con licencias incluidas. Apertura clara de salón, cambio a fondo berenjena al aparecer la solución. Misma mano, teléfono y agenda durante el recorrido; 16:00 como horario ilustrativo único. Titulares y subtítulos editoriales de 2–3 palabras, sin cajas, separados de objetos y CTA.

Voz existente de Jorge: hLV6NMOMeGIqdvcW8Uxr. Sin clonación. Segunda toma autorizada por su pedido de corrección, separada de la primera. Consulta de modelos, compatibilidad de voz profesional y factor de costo antes de generar. Guía oficial de ElevenLabs consultada: v4/v3 usan etiquetas de interpretación (curious, excited, warmly) sin enviar controles de velocidad o estilo incompatibles. El modelo anterior usa velocidad 1.12, menor estabilidad y mayor estilo. Selección mediante modelos del catálogo y modelos compatibles declarados por la propia voz, no un nombre supuesto. Se retiran únicamente nuestras etiquetas de la alineación de subtítulos, conservando tiempos reales. La entonación final requiere evaluación humana: los parámetros no garantizan una buena interpretación.

Música instrumental y siete efectos tomados de la biblioteca suministrada en el repositorio, con procedencia y hashes en `production/audio/manifest.json`. No se extrae el audio de las referencias ni se pide nueva música a una API. Música -13 dB con reducción bajo voz; efectos -9 a -12 dB, alineados con 14 acciones. No normalizar efectos cortos por LUFS. Mezcla final objetivo -16 LUFS y pico <= -1.5 dBTP.

Alineación real de caracteres y escenas desde ElevenLabs. Sin aprobación, programación ni publicación automática. Conservar cada versión y sus comprobaciones; una revisión técnica no equivale a escucha subjetiva ni aprobación de Jorge.

Lote de tres autorizado el 16 de noviembre: reserva, recordatorio y cambio de horario, con tres músicas elegidas de la biblioteca aprobada (A/B/D). Los titulares proceden del guion y cada variante adapta mensajes y movimiento de agenda; los ejemplos no son capturas del producto. Una narración con voz Jorge Q por ficha, tres IDs concretos. Mantener originales de audio; producción incorpora copias versionadas del clic 02, golpe 02 y ticks/destellos revisados. Jorge indica «está mejor, luego veremos más adelante» y pide continuar: aceptación para este lote, no afirmación de perfección sonora.

## Corrección de Jorge · producción única por pieza

Jorge rechazó variar textos sobre una misma estructura: «CADA VIDEO debería tener una producción increíble y único». La mano/teléfono/agenda del primer video es una solución histórica, no la plantilla universal. Cada nueva idea requiere concepto visual, composición, animación, transiciones y sonido propios. La marca, los recursos aprobados y los subtítulos pueden ser coherentes entre piezas; la historia visual debe cambiar.

El lote actual reemplaza las variantes iniciales por tres módulos independientes: conversaciones que se transforman en reserva (`scene-reserva.mjs`); escritorio de papeles, reloj y sobre (`scene-recordatorio.mjs`); agenda en perspectiva con dígitos y cita desplazable (`scene-horario.mjs`). Cada uno tiene su mapa de contactos sonoros. Revisar acciones completas, no solo cuadros aislados. Estas decisiones no acreditan equivalencia estética con las referencias ni sustituyen la revisión de Jorge.

## Estándar de producción ampliado · 16 de noviembre de 2026

Jorge autoriza seis mejoras: historia visible, variedad de planos y materiales, concepto propio por idea, voz con intención, sonido diseñado y revisión del render. Piloto «El hilo de una cita»: conversación → selección → reserva. Pipeline A, Canvas con profundidad 2.5D y materiales ilustrados; no se presenta como rodaje real ni 3D fotorrealista. Se reutiliza el máster de Reserva y la música C; ninguna generación nueva de audio. Se conservan las tres piezas existentes.

Paleta: berenjena #21102E, violeta #AD52E0, rosa #F2B4D0, marfil #FAF7FD. Montserrat para interfaz y subtítulos; Instrument Serif para titulares breves. Composición varía por plano: detalle lateral, retirada, selección cercana, vista cenital y cierre. Cámara con anticipación de 120 ms, cambios de 350–700 ms y pausas de lectura; sin flashes. Subtítulos centrados a y=1430, dentro del margen móvil; los objetos no los tapan. Cada contacto y transición tiene cue compartido con el movimiento; silencio de efectos tras la selección. Evaluar el archivo terminado por seis criterios y registrar explícitamente lo que no se escuchó/observó.
