# Glowfy · Muestra de dirección visual

Propuesta original de 12 segundos para revisar el lenguaje visual que falta en la oficina. No es una conexión automática nueva del trabajador ni una pieza aprobada.

Reutiliza el contrato de dibujo Canvas por tiempo del estudio existente y las fuentes OFL del repositorio. Geometría y secuencia específicas nuevas; no requiere copiar el código protegido de ninguna habilidad. Dependencias ya comprobadas en el entorno de desarrollo: Node, @napi-rs/canvas, FFmpeg y Python con fontTools. No instala ni descarga paquetes al ejecutarse. Las instancias estáticas de Montserrat se generan en cache porque Skia no respeta el eje de peso del archivo variable en este entorno.

Desde esta carpeta:

```bash
node src/render.mjs --from 0 --to 4 --fps 8 --scale 0.25 --out cache/apertura-v1 --jpg
python3 src/sound.py --out cache/sonido-v1.wav
python3 src/build-review.py
node src/render.mjs --from 0 --to 12 --fps 30 --scale 1 --out renders/previews --name 'Glowfy - Propuesta visual v1' --audio cache/sonido-v1.wav
```

Usar un nombre nuevo para cada salida; el renderer rechaza sobrescrituras. `plan/design.html` presenta la propuesta y permite reproducir/recorrer la animación sin servicios externos. `plan/beats.json` es la única fuente de tiempos.

Los sonidos son síntesis matemática propia, no una voz ni música de referencia. El logo se recupera del sitio oficial; las fuentes Montserrat e Instrument Serif conservan las licencias OFL que ya figuran en `estudio-video/assets/fonts`. Ver `manifest.json`.

La prueba no usa la cuenta Codex ni el VPS. Antes de integrarla al flujo: contrato de storyboard, render aislado y control visual posterior al render. No ejecutar código producido por un modelo dentro de la web.
