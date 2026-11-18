# Producción multimarcas: integración propuesta
> Directriz vigente de Jorge: los dos videos aportados el 15 de noviembre son el mínimo visual y audiovisual. Ver [estándar y cambios requeridos](ESTANDAR-AUDIOVISUAL.md). Las tarjetas fueron rechazadas; el ensayo ilustrado posterior tampoco acredita equivalencia con las referencias.
Corte de inspección local: 15 noviembre 2026. Documento de diseño, NO prueba de producción autónoma ni despliegue.

## Inventario comprobado
Repositorio inspeccionado: /tmp/oficina-read-review (copia disponible del original). No se ejecutó su servidor ni servicios externos.
- agents.mjs: estratega (investigación), guionista, video (estudio), community (publicación), media (pauta), coordinador. Sus modelos Claude, horarios, presupuestos USD, Honduras, voz y metas Cresova NO son configuración de Jorge.
- prompts/video.md define guion → voz → alineación → escenas → mezcla → previews → cola → informe. Reutilizable como arquitectura, no literalmente con identidad/permisos de Diego.
- estudio-video/src/render.js: Canvas/Playwright captura por tiempo absoluto, pipe FFmpeg, salida versionada; prueba base src/scenes/example.js de 3 segundos NO es video comercial.
- estudio-video/videos/_plantilla/src: objetos.js, objetos2.js, amano.js, nucleo.js, estudio3d.js, cresova.js, escena cierre/capa. Base concreta para profundidad/objetos, no hace falta inventar motor desde cero.
- videos/09-cinco-cosas: toma.js, beats.js, plan/script.md, plan/beats.json, audio con alineación. beats declara 22.98 segundos, 30fps. Ejemplo editorial Cresova, no demostración Glowfy.
- scripts: beats_from_voice.mjs y beats_to_src.mjs, mezcla.mjs, scan_negro.mjs, captura_estatico.mjs, hoja_previa.sh, cola_render.sh, portadas.mjs; candidatos a adaptadores aislados después de revisión de rutas/efectos laterales.
- Assets presentes: logo Cresova, imagen ficticia clinica-dental-5.png, fuentes, SFX listos/generados y marca sonora. Presencia no equivale a permiso de reutilización comercial para otra marca. Inventariar licencia por archivo. NO empaquetar voces de ejemplo como voz de Jorge.
- package.json del estudio fija playwright 1.49.1 y three 0.170.0. Chromium y FFmpeg son requisitos adicionales. README solo declara prueba corta y mezcla, no render completo 1080 validado.
- voz_tomas.mjs hace llamadas cobrables ElevenLabs (eleven_v4) inmediatamente; NO invocarlo sin adaptador con autorización/techo explícito. TASTE menciona otro modelo; no adivinar cuál aplicar.
- videos.mjs usa OpenRouter/Gemini para analizar referencias. No permitido como fallback automático bajo restricción sin API adicional.
- FALTANTES indica ausentes 48 videos, referencias privadas y fuentes Fontshare. No prometer reproducir toda la biblioteca original.

## Relación con skills
Se leyeron dirigir-contenido-multimarcas y referencias equipo/calidad/asignacion; motion-video-director 3.5.2. Son guías, no procesos siempre encendidos. El MCP/entorno actual sí permite leer motion director: la afirmación histórica de FALTANTES de que solo sirve en Claude no debe convertirse en bloqueo universal. No se redistribuye ni copia el complemento protegido al fork. El motor del repo funciona por separado. Esta especificación es propia, no un paquete del complemento.

## Contrato de pieza
Cada job debe portar brandId, jobId, revision, inputHash, brief, evidence[], assets[], permissions, outputs y qa. Cada asset: id, hash, origen, derechos/estado, versión, propósito y disponibilidad comprobada. Datos desconocidos = null; no rellenar precios, colores, testimonios o funcionalidades. Estado de conexión no implica permiso de uso ni gasto.
Brief: audiencia, dolor, oferta comprobada, canal, acción única, idioma/país, duración orientativa, modo (narrado/silencioso), hechos permitidos, restricciones, referencia y estilo aprobado. Ruta por marca y pieza; no compartir estilos/logos/voz implícitamente.
Stages con artefacto propio: contexto → estrategia → guion → evaluación independiente → storyboard → recursos/voz → tiempos reales → escenas/render corto → QA → render final → revisión Jorge. Investigación puede omitirse para contenido permanente con evidencia suficiente. Libertad creativa vigente permite producir candidatos sin preguntar cada decisión; no autoriza publicar ni gastar.
Retorno de cada especialista: status, inputHash, artifactIds, claimsConFuentes, dudasEsenciales, revisiones, consumo medido/desconocido, siguientePaso. No pasar únicamente nombre de agente o instrucciones del tipo “haz lo de siempre”.

## Recomendación técnica integrable
Mantener la animática FFmpeg existente como modo de prueba explícito. Agregar rendererId `canvas-cresova-adapted` separado, detrás de capability comprobada. Primero reutilizar objetos/escenas del repo para un fragmento nuevo sin identidad Cresova; no reemplazar todo el frontend por el ejemplo de prueba.
Convertir storyboard a datos tipados; la ejecución de código generado, si se habilita posteriormente, va al trabajador aislado del integrador, nunca al servidor web con secretos. Un render por vez al inicio. Preview de inicio/centro/cierre + medición rendimiento antes de 1080 final; recuperar pruebas válidas por hash.
Adaptador de voz devuelve archivo + alineación + identificación de voz autorizada + uso, o blocked. Música opcional; no se añade porque exista biblioteca. Una pieza silenciosa puede ser final solo si ese modo fue pedido/aprobado; si falta narración requerida es animática, no final.
El personaje “Lucía trabajando” solo se anima con evento real de etapa, no por un temporizador ornamental.

## Ejemplos de briefs propuestos (NO aprobados ni material final)
Glowfy: manicuristas que atienden mientras llegan consultas. Hook: “¿Haces uñas o contestas mensajes?” Escena 1: mano/mesa de manicura con mensajes que interrumpen; escena 2: transición a captura real autorizada del enlace de reservas; escena 3: una sola invitación “Conoce Glowfy”. Usar interfaz real verificada o maqueta rotulada; no afirmar que elimina ausencias ni llena agenda. Identidad/colores desde ficha actual, no inventarlos.
Velforce: negocio con alto volumen de consultas. Hook: “Te escribió. ¿Quién le dio seguimiento?” Escena 1: consulta que queda detrás de otras; escena 2: movimiento continuo a ficha/seguimiento real del CRM; escena 3: “Conoce Velforce”. No inventar tasa de cierre, omnicanal listo ni precios.
Quiba: foto autorizada de ventana/barandal → detalle de acabado → contacto/cotización. Purify: situación cotidiana → equipo real → consulta; sin promesas de salud o purificación no comprobadas. No usar plantilla Cresova ni paleta Glowfy indiscriminadamente.

## QA: condiciones para entregar a Jorge
1. Primeros 2 segundos identifican audiencia/problema sin necesitar explicación. Móvil: observar video reducido, no solo canvas 1080. Titular corto, objetos con propósito y texto suficiente tiempo; no exigir movimiento cada segundo por regla heredada.
2. Storyboard: al menos una transformación/interacción significativa, jerarquía y profundidad cuando ayudan. No vender slide con zoom como equivalente al motor original. Evitar partículas/bloom gratuitos, cortes ilegibles y texto técnico de producción.
3. Marca/verdad: logo auténtico, CTA exacto, UI real o ejemplo rotulado, fuentes/licencias comprobadas. Cada afirmación comercial enlazada a evidencia.
4. Voz: pista existe, pronunciación y mezcla revisadas; alineación con palabras/eventos, sin colas truncadas. Objetivo orientativo -16LUFS / pico <=-1.5dBTP solo con medición. Métrica no sustituye escucha; registrar si QA solo inspeccionó imágenes.
5. Técnico: ffprobe, decode completo, duración/fps/dimensiones, detección negro y revisión visual de alertas; comprobar reproducción/descarga del mismo hash final. Previews no acreditan export final. No declarar “sin fallos” por exit 0.
6. Resultado QA independiente = cambios o listo para revisión, no publicación. Aprobación de Jorge ligada a hash/revisión; cambio invalida aprobación anterior. Social desconectado no bloquea descarga/revisión, pero no mostrar publicado.
7. Etiquetas UI separadas: configurado / mock probado / animática renderizada / motor real probado / QA realizado / aprobado / publicado verificado. Un MP4 de seis segundos con especialistas simulados no cumple autonomía productiva.

## Siguiente hito sensato
Primer fragmento 5–8s con guion original Glowfy, marca/recursos reales recuperados, objetos animados y QA visual; después pieza completa y segundo brief Velforce en la misma cadena sin cruces de marca. Conectar inferencia/voz únicamente al resolver las dependencias reales. No exigir CRM, tesorería o publicación para probar calidad del motor. No hay evidencia nueva de que esos hitos ya se ejecutaron en esta revisión.
