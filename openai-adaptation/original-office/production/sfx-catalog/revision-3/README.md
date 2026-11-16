# Revisión 3 · SFX v3

Jorge aprobó las propuestas de revisión 2 para clic-boton-02, golpe-grave-02 y teclas-suaves-01. Solicitó otra corrección de destello-particulas-01/02 y tick-cursor-01/02 y pidió comprobar el modelo nuevo de ElevenLabs.

La documentación oficial confirma SFX v3 desde el 2 de noviembre de 2026; el MCP conectado todavía enumera solo v2. Se consultó la ampliación de herramientas y no ofrece v3. Esta prueba usa el endpoint oficial `/v1/sound-generation`, con `model_id=eleven_text_to_sound_v3`, desde la oficina y con la llave cifrada ya guardada. No exporta la clave. Fuentes: https://elevenlabs.io/docs/changelog/2026/11/2 y https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert .

Plan fijo en `production/sfx-review-plan.mjs`: cuatro solicitudes, una por efecto, 1/1,25/0,5/0,5 s, sin loop, influencia 0,8. La tarifa documentada de 40 créditos/s da 130 créditos estimados. Se comprueba cuota incluida antes del lote y antes de cada solicitud. No se habilita sobreconsumo ni reintento de resultados inciertos. Los importes reportados se conservan cuando el proveedor devuelve `character-cost`.

Activación administrativa única: `OFFICE_SFX_REVIEW_BATCH=glowfy-sfx-r3`. El App inicia el lote una vez, secuencialmente, conservando intentos y resultados bajo el volumen privado de videos. Una intención durable antecede a cada petición; los resultados completos se reutilizan por hash y los inciertos se bloquean. La descarga autenticada de estado/audio es de solo lectura y no inicia generación. Cambiar una URL o un cuerpo HTTP no cambia modelo, duración, cantidad ni prompts.

Las pruebas automatizadas usan proveedores simulados. Comprueban cuatro solicitudes, ausencia de reintentos tras reinicio, cuota insuficiente, resultados inciertos, modelo explícito, host fijo, autenticación y rechazo de escritura HTTP. La prueba real se registra aparte; una prueba de código no acredita calidad sonora.
