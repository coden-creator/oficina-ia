# Biblioteca musical de Glowfy

Jorge escuchó las cuatro muestras y eligió conservarlas todas: «Las 4! Para asi tener variaciones musicales. Ya logre escucharlas».

Las variantes A, B, C y D son instrumentales de 20 segundos, generadas una vez en ElevenLabs Music v2 para una identidad moderna, cálida y elegante. La estimación autorizada fue de 2.200 créditos; el proveedor reportó 1.199,73 créditos al completar las cuatro generaciones. Reproducir o reutilizar estos MP3 no realiza llamadas a ElevenLabs.

El manifiesto `production/audio/glowfy-music.json` registra la selección, el identificador del proveedor, SHA-256, duración y medidas de audio. La aprobación se limita al uso de esta música en Glowfy; no aprueba piezas de video ni publicaciones, y no alcanza a los efectos pendientes de diagnóstico.

## Uso en la oficina

En Estudio de contenido, **Música de Glowfy** permite escuchar y descargar las cuatro variantes con la sesión privada existente. El enlace `/?brand=glowfy#/estudio?musica=1` abre la biblioteca. Cambiar de marca detiene la reproducción y retira sus recursos; no hay un segundo selector de marca.

La producción Glowfy con perfil `social-v2` selecciona una variante mediante un hash estable del identificador de la pieza. Las correcciones de esa pieza conservan su música. Distribuye los trabajos entre las cuatro variantes, pero dos piezas consecutivas pueden coincidir; no es una rotación estricta ni una selección editorial por estado de ánimo. El banco v1 conserva sus cuatro entradas y orden.

La mezcla usa la sonoridad medida de cada MP3 para aproximar la base a −27 LUFS, aplica ducking durante la voz y fundidos de entrada/salida. El control final de sonoridad del video sigue activo. El mapa `sound-cues.json` y el resultado de producción registran qué variante se utilizó. Los originales permanecen sin modificar.

## Límites y verificación

Se comprobaron hashes, cuatro archivos distintos, decodificación de las cuatro pistas, mezcla real de FFmpeg con cada variante, estabilidad entre revisiones, autenticación, aislamiento de marca, descargas y rechazo de escrituras HTTP. La UI se revisa en escritorio y móvil, con reproducción, teclado y descarga comparada por hash.

Esta integración no vuelve a renderizar la pieza existente ni inicia una nueva síntesis de voz. Se conserva el alcance de producción autorizada de la oficina; no se amplía el consumo pagado a nuevas solicitudes. El salto visual solicitado respecto a las referencias sigue siendo un trabajo aparte.
