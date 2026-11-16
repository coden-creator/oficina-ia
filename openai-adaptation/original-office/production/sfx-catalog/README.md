# Catálogo audiovisual de efectos · Glowfy

Jorge pidió identificar los sonidos que quiere cambiar. El catálogo reúne los 36 efectos existentes, numerados y con nombre: A es el MP3 original de ElevenLabs en `estudio-video/assets/sfx/generated`; B es el WAV procesado en `estudio-video/assets/sfx/listos`. Cada versión se reproduce dos veces, con pausas, sin música ni voz superpuesta.

Entrega: `production/audio/glowfy-sfx-catalog.mp4`, 255,75 s, 720×1280, H.264 a 24 fps, AAC estéreo a 48 kHz/256 kbps. Tiene 36 capítulos y un índice en [INDICE.txt](INDICE.txt). La oficina lo ofrece en **Estudio → Revisar los efectos de sonido**, con reproducción, salto a cada efecto y descarga privada. Enlace directo: `/?brand=glowfy#/estudio?efectos=1`.

Para comparar se aplica únicamente una ganancia constante por fuente, aproximadamente a −10 dBTP. Se conservan los silencios, ataques, colas y cortes de cada archivo. No hay reparación, recorte, ecualización, compresión ni reducción de ruido. La codificación AAC final tiene pérdida: este MP4 facilita señalar problemas; una reparación posterior debe contrastarse con los archivos fuente. Las alertas técnicas del análisis no equivalen a defectos creativos confirmados.

Formato de devolución: **número + A/B/ambas + qué falla**, por ejemplo «12, B: chasquido al final». La aprobación de las cuatro músicas no aprueba estos efectos. No se cambia ninguna pieza ni se regeneran sonidos hasta identificar los cambios solicitados. Esta entrega no llama a proveedores ni consume créditos.

## Reproducir el montaje

Desde un checkout completo del repositorio, con Python, Pillow, NumPy, SciPy y FFmpeg:

```bash
python3 production/sfx-catalog/render.py --output /tmp/glowfy-catalogo-efectos
```

`catalog.json` conserva los hashes y el análisis de las 72 fuentes; el render verifica cada hash. El manifiesto junto al MP4 registra el orden, los tiempos, la ganancia aplicada y los hashes. Logo y Montserrat provienen de `production/glowfy/assets.json`; se conserva la procedencia y licencia de los recursos existentes. El generador no se incluye en la imagen de producción y no procesa rutas ni código enviados por usuarios.

## Verificación de esta entrega

Decodificación completa sin errores; 144 reproducciones comparadas con su fuente, correlación mínima 0,99001 tras AAC; −22,99 LUFS integrados y −9,88 dBTP. No se normaliza el conjunto a −16 LUFS porque contiene pausas y transitorios aislados. Se inspeccionaron 72 cuadros del MP4 exportado, uno por versión y efecto. Esto no sustituye la escucha y selección de Jorge.

Las pruebas HTTP verifican autenticación, aislamiento de marca, integridad SHA256, descarga completa, HEAD y rangos para búsqueda. Chromium local verificó reproducción, saltos 1/12/36, descarga, teclado, móvil sin desborde y cero errores JavaScript. La comprobación del despliegue se registra por separado en `production/evidence/glowfy-sfx-catalog.json`.
