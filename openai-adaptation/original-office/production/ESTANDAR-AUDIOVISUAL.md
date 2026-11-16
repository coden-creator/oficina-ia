# Estándar audiovisual de Jorge

Vigente desde el 15 de noviembre de 2026. Jorge aportó dos videos de la oficina original de Claude como **mínimo de producción visual y audiovisual** y priorizó calidad sobre velocidad. Esta decisión sustituye cualquier aceptación implícita de las tarjetas técnicas como resultado creativo.

## Referencias verificadas

| Referencia | Duración | Imagen | Audio | Mezcla medida |
| --- | --- | --- | --- | --- |
| Final 2026-11-15-16-32.mp4 | 19,80 s | 1080×1920, 30 fps, H.264 | AAC, 48 kHz, estéreo | −16,19 LUFS integrados; −3,30 dBTP; LRA 1,50 LU |
| Final 2026-11-15-16-47.mp4 | 21,13 s | 1080×1920, 30 fps, H.264 | AAC, 48 kHz, estéreo | −16,30 LUFS integrados; −3,40 dBTP; LRA 1,60 LU |

Se extrajeron secuencias de toda la duración a 4 fps y los primeros 90 cuadros de cada video a 30 fps; se inspeccionaron las hojas generales y aperturas. Las medidas de mezcla son del archivo completo con FFmpeg. No son una separación de voz/efectos, una transcripción ni una escucha humana. Los archivos y cuadros privados permanecen fuera del repositorio; los hashes de identificación y medidas están en `evidence/reference-standard.json`. No se redistribuyen los videos ni sus pistas de audio.

## Qué construye el nivel de referencia

**Referencia 16:32 — el sistema se construye delante del espectador.** En 0–3 s ya hay marca, titular y tablero; un contador se anima y una web entra con perspectiva. Entre 3–10 s aparecen módulos de clientes, inventario, pedidos, tareas y reportes, cada uno con una acción visible. En 10–16,5 s el mismo contenido pasa a varios dispositivos, se muestra un entorno y un equipo, aparecen manos y anotaciones. Un barrido lleva al cierre de llamada en aproximadamente 16,5–19,8 s. Son rangos observados, no una receta de segundos obligatoria.

**Referencia 16:47 — el objeto cuenta el problema y la solución.** En 0–4,5 s el teléfono muestra chats personales y de negocio, indicadores y mensajes que cambian. En 4,5–9,5 s viaje, enfermedad y cambio de teléfono se expresan con objetos; las conversaciones salen del dispositivo y la pantalla queda vacía. En 9,5–14,5 s un teléfono de empresa recibe conversaciones, nombre, horario y respuestas. En 14,5–18,7 s intervienen manos/equipo y el objeto cambia de escala. En 18,7–21,13 s llega el cierre con una acción para compartir. No se debe copiar el texto comercial como oferta de Glowfy.

Las dos piezas combinan una escena principal con capas: entorno desenfocado, luz ambiental, dispositivo o tablero, elementos de interfaz, anotaciones y texto. La tipografía tiene jerarquía: titular fuerte, palabras de énfasis y subtítulos por frases. El movimiento explica cambios de estado; no hay que sustituirlo por zoom sobre una imagen. La identidad de Cresova sirve como referencia de disciplina visual; Glowfy y Velforce mantienen sus logos, paletas y afirmaciones verificadas.

## Directrices obligatorias de producción

1. **Historia visible desde el primer cuadro.** Identificar audiencia/problema y objeto protagonista. Cada escena especifica qué cambia y por qué. El nivel de detalle debe sostener una revisión a pantalla completa; el texto principal debe leerse en móvil.
2. **Escenas y acciones.** Storyboard con capas, objetos, interfaz, gestos, cámara, entradas, pausas, salidas y continuidad. Animar acciones como responder, reservar, ordenar, transferir o confirmar. La misma pantalla debe conservar su estado durante la transición.
3. **Dirección de arte por marca.** Logo real, fuentes con licencia, tratamiento consistente de materiales/luz/sombras y fondos. Recursos reales autorizados o maquetas identificadas. No adoptar por defecto el rojo, los datos, el teléfono o la voz de Cresova.
4. **Voz como parte de producción.** Guion completo y voz autorizada; alinear palabras/eventos con el audio real antes de cerrar tiempos. La existencia del plugin no autoriza generación pagada ni clonación. Un ensayo silencioso puede servir para revisar imagen, pero no satisface este estándar audiovisual.
5. **Sonido con intención.** Mapa de contactos, notificaciones, confirmaciones y transiciones; silencios deliberados donde correspondan. Mezclar con la voz sin enmascararla, evitar colas y ruido gratuito. Música solo si corresponde al brief y hay derechos/autorización. Objetivo inicial de mezcla cercano a −16 LUFS, pico ≤−1,5 dBTP, ajustado tras escucha; no igualar una métrica a calidad.
6. **Subtítulos y énfasis.** Frases sincronizadas con la narración, acentos comprobados, palabras destacadas con intención y permanencia suficiente. No llenar el video de texto ni poner notas internas, líneas de tiempo o etiquetas de diagnóstico en la entrega.
7. **Revisión sobre el video renderizado.** Apertura, transformación principal y cierre se comparan con estas referencias, además de revisar el clip completo, voz, mezcla, cortes, legibilidad y afirmaciones. Un veredicto del guionista o una decodificación exitosa no sustituyen esta revisión. Jorge conserva la aprobación final por versión/hash.

## Diagnóstico y cambios concretos en la oficina

El adaptador actual solo puede producir `text-cards` o `phone-cards-demo`, con composiciones `centered-text`, `phone-cards` y `closing-card`. Su guion se reduce a `text` + `durationSeconds`; no hay contrato de escena, voz, tiempos de palabras ni mezcla. El agente de revisión evalúa el guion **antes** del render. Esa limitación explica por qué conectar Codex no produjo el nivel solicitado.

Las nuevas solicitudes HTTP usan `cresova-reference-v1`. Mientras solo existan esos motores técnicos, se conserva el brief y se informa `REFERENCE_PRODUCTION_NOT_CONNECTED` antes de consumir inferencia. `technical-test` queda disponible explícitamente para diagnóstico y para preservar pruebas/historial; nunca acredita acabado comercial. Este cambio está en código de revisión, no implica que se haya desplegado.

Para conectar producción hay que entregar, en orden:

- Un contrato de storyboard y recursos que exprese los objetos/acciones anteriores, separado del contrato de tarjetas. El contexto de marca y estas directrices deben llegar completos a cada etapa.
- Voz autorizada, alineación real y mapa común de eventos para animación, subtítulos y sonido.
- Render de escenas del estudio, aislado del trabajador de autenticación, con dependencias verificadas y un render simultáneo. Reutilizar módulos existentes compatibles; no ejecutar código libre del modelo dentro de la web.
- Un fragmento representativo que incluya escena, interacción, transición y sonido; compararlo con ambas referencias y corregirlo antes de completar la pieza.
- QA audiovisual posterior al render, evidencia y descarga de la versión exacta; después revisión de Jorge. Solo una implementación verificada debe cambiar `productionCapability().ready`.

El ensayo local `estudio-video/proyectos/glowfy-manos` se conserva como trabajo exploratorio anterior a estas referencias. No cumple todavía el estándar: falta narración, subtítulos alineados, mayor elaboración de entorno/interfaz y revisión audiovisual completa. No se conecta automáticamente ni se presenta como entrega final.

## Criterio de aceptación

La pregunta de revisión es: «¿Esta pieza sostiene el nivel de elaboración, claridad, movimiento y sonido de los dos archivos de referencia, usando la identidad y los hechos de esta marca?». Si falta una dimensión, registrar el cambio requerido y producir otra versión. No reducir el estándar para cerrar una prueba técnica; tampoco afirmar equivalencia por resolución, cantidad de agentes, duración o puntaje automático.

## Variedad exigida por Jorge · 16 de noviembre de 2026

Cada pieza necesita una dirección de arte y coreografía propias. Reutilizar exactamente una secuencia de objetos y sustituir sus textos no satisface el pedido. Antes de exportar, comparar entre las piezas del lote: concepto, objeto protagonista, composición, acciones, transiciones, cámara y sonido. La consistencia de marca no exige repetir la producción. El lote Glowfy de tres piezas dispone de tres módulos locales independientes; futuros conceptos requieren su diseño e implementación, no se promete generación ilimitada de escenas arbitrarias por Codex.
