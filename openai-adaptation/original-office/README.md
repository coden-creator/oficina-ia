# Oficina de Jorge · estado vigente

## Producción por proyecto · 16 de noviembre de 2026

La oficina está conectada al trabajador `gpt-6-astra` con razonamiento `high`, mediante el uso incluido de ChatGPT. El plan de edición, la autoría de escenas y la revisión de imágenes del lote nuevo usan ese modelo. Las etapas iniciales de las dos primeras fichas comenzaron con Sol; se conserva la procedencia por etapa. [Estado y entregables](production/glowfy/PROGRESS.md).

El protocolo `glowfy-authored-motion-v2` permite construir geometría vectorial, jerarquías, materiales, animación y contactos sonoros por proyecto. El especialista entrega datos validados, sin ejecutar JavaScript generado ni cargar URLs/recursos arbitrarios. El director recibe cuatro secuencias de imágenes renderizadas y solicita correcciones concretas; su revisión no equivale a la aprobación audiovisual de Jorge.

La ruta se activa únicamente para los IDs autorizados en `OFFICE_AUTHORED_VIDEO_JOB_IDS`, con autorización registrada en cada ficha. Usa la voz existente autorizada de ElevenLabs, música y efectos de la biblioteca elegida, guarda los resultados en el volumen privado y reutiliza la voz al corregir imágenes. No hay publicación ni programación automática. La investigación sigue limitada a evidencia suministrada; no se afirma investigación web autónoma.

Las observaciones de cada render se vinculan a su versión y hash. Los cuadros de revisión se renderizan individualmente a 1080×1920 antes de componer el contacto visual. El cierre conserva fondos claros/oscuros y evita repetir logo, CTA o aclaraciones ya presentes. Las correcciones del compositor invalidan la revisión de imágenes y conservan los diseños previos; no autorizan nueva síntesis de voz.

Pendientes vigentes de Jorge: [Estudio, identidades de marca, animaciones e integración social](production/PENDIENTES.md).

Biblioteca musical: Jorge eligió las cuatro variantes de Glowfy. Se incorporan reproducción/descarga privada en el Estudio y selección estable por pieza en el mezclador social. [Alcance y evidencia](production/glowfy/MUSICA.md).

La aplicación funciona en el App existente `service/oficina-jorge`, rama `codex/revision-visual`, build `Dockerfile.easypanel`. La web, el trabajador Codex y la conexión cifrada de ElevenLabs están conectados. La actualización por MCP conserva los cuatro montajes persistentes y el login.

La primera prueba completa de Glowfy ejecutó cinco etapas reales de Codex, voz Jorge Q y MP4 1080×1920. Jorge rechazó su acabado: faltaban música, efectos audibles, ritmo e interpretación de voz. La revisión social incorpora recursos del estudio original y dirección de voz conforme a la guía de ElevenLabs. Tras la autorización expresa de Jorge, la segunda toma y el montaje real terminaron: 18,1 s, Eleven v4, música y efectos; la versión 3 está disponible en la oficina para revisión. No hay aprobación ni publicación.

Estado detallado: [Glowfy](production/glowfy/PROGRESS.md), [directrices de montaje](production/glowfy/TASTE.md), [estructura visual](UI-DESIGN-REVIEW.md), [límites de empaquetado](PACKAGING.md). Esta corrección usa `OFFICE_VOICE_TEST_TAKE=2` y `OFFICE_VOICE_PROFILE=social-v2`, activados únicamente para la pieza autorizada. Ver [evidencia del resultado real](production/evidence/glowfy-social-real.json).

Los apartados siguientes documentan etapas históricas. Las afirmaciones antiguas de ausencia de voz, música, conexión o despliegue no describen por sí solas la prueba actual; la síntesis sigue limitada a los IDs y tomas expresamente autorizados.

## Real functionality
- Preserves original office canvas, rooms, navigation and visual styles with audited unavailable states.
- Optional video panel saves requests for five separate brands, with objective and CTA.
- Authenticated HTTP workflow connects to createVideoFlow: create/list/get/run/requestChanges/accept version+hash.
- API exposes artifact URL only, never absolute file path. Download authenticates, checks brand/job/version, real path confinement, MP4 kind/size and SHA256.
- Accept means accept_artifact_only, not publication. API has no publisher or spending action. Optional credential setup is described above. Paid calls, voice and cloning unsupported.
- Workflow storage and model runtime are separate. Server starts no model process and uses no adapter by default. Without connected runner, run persists blocked rather than inventing content.

## Deployment behavior
- Default: visual shell only, no video records. Enable internal workflow explicitly with OFFICE_ENABLE_VIDEO_WORKFLOW=1, OFFICE_VIDEO_DATA_DIR=/data/video on a dedicated UID1000 writable persistent volume. Preserve existing volumes; never share another service's data or tokens.
- When the workflow is enabled, startup checks that the configured directory already exists, has no symlink components and is writable. This does not establish that a volume is mounted or persistent; verify persistence separately. A new Docker-managed volume initialized from the image can inherit the directory ownership; existing volumes and bind mounts must already be writable by UID1000, and must never be re-owned without reviewing their contents.
- Mandatory private OFFICE_PASSWORD>=16, exact HTTPS OFFICE_ORIGIN; HOST0.0.0.0 PORT3000. TLS still requires actual proxy/certificate verification. Dockerfile health is liveness only.
- Docker context this directory and Dockerfile. Image copies the visual shell and video source, including renderer modules, excluding tests, but no model runtime, credentials or installed renderer binaries. Tests are not run by startup. No npm install, paid SDK, model binary or outbound dependency.
- Codex adapter source included in review archive only for future integration/tests. Runtime activation is NOT wired into production start. Owner official login, process isolation and deployment-specific review remain required.
- FFmpeg renderer runs only when explicitly injected, which is done in tests, not default deployment. It produces a basic silent 360x640 animatic, not the finished creative quality of Diego's system.
- Single worker/replica. Set1CPU/512MiB initial ceiling within owner global limits. No actual Docker build or resource enforcement verified here.

## Test evidence
`node --test test.mjs video-http.test.mjs video/flow.test.mjs video/process-runner.test.mjs packaging.test.mjs production.test.mjs material-import.test.mjs renderer-selection.test.mjs visual-contract.test.mjs test/visual-specialist.test.mjs video/creative-review.test.mjs drawtext.test.mjs connectors/contracts.test.mjs connectors/elevenlabs-adapter.test.mjs production/template-bridge.test.mjs production/template-render.test.mjs` passed 87 tests. See TEST-RESULTS.txt. Tests cover real HTTP and local MP4 rendering plus explicitly simulated specialist outputs, not authenticated inference. Includes symlink/identity protections, atomic fsync persistence, per-store writer lock and caps.
- HTTP create, brand separation, CSRF-origin rejection, withheld paid flags and persisted state after HTTP server restart: real.
- CodexVideoSpecialist + real runtime class without authentication: blocked, process factory not called, no inference.
- Full stages in second test: deterministic specialist fixtures clearly labelled NOT-AI; no model result claimed.
- FFmpeg MP4 encoding/inspection and authenticated byte download: real local operations; hash/version approval and revision invalidation tested.
- Visual browser QA unavailable: Chromium fails process-singleton socket with Operation not permitted. No screenshot or sandbox bypass.

## Known limits
Shared BasicAuth identity, no per-person audit identity/MFA. Actor strings are set by server, not accepted from clients. They do not grant external publication authority. No request-id deduplication for create, long-lived SSE or actual generation-status push yet. Current UI shows generic sanitized blockers to avoid leaking internal file paths. No real source retrieval in research stage; supplied evidence only. Model/renderer/provider status must not be inferred from adapter object existence.

Do not call this autonomous end-to-end video production or completed office. It is a protected original visual shell with actual internal request workflow and integration boundary awaiting official login and render deployment.

Current snapshot records a working internal workflow, not an authenticated model release. Separate official-bin packaging and host isolation verification remain in progress and are intentionally absent from enabled startup.

Packaging update: Dockerfile.runtime and pinned npm lock/official FFmpeg recipe prepared; separate packaging test brings suite to25/25. This DOES NOT include a successful isolation gate: real gate currently FAILS for unified_exec without managed requirements. See PACKAGING.md and runtime-package/ADVERSARIAL-GATE.md. Auth remains off.

Production interface update: five brands, per-stage provenance, technical QA vs owner acceptance, optional audience/channel/supplied evidence. Original hand-drawn primitives adapted with explicit color only; asset manifest excludes media/voice/logo reuse. Current test count is reported above; no authenticated model is connected. Managed restriction configuration now verified22/22 disabled in offline overlay, but actual tool inventory/adversarial sandbox remains unverified. See PACKAGING.md.

## Current review scope
Original office visual shell, responsive labeled workflow UI, local TXT import with explicit approval and brand isolation, hardened storage and HTTP, two opt-in technical render adapters. Canvas 2.5D is an illustration, not the original Three/Playwright renderer or verified commercial output. Its dependency is not installed by either Dockerfile; keep OFFICE_ENABLE_CANVAS_DEMO unset until independently verified. No model login/runtime is wired to start.mjs. Managed feature restrictions were verified without authentication; tool inventory and adversarial isolation remain blocked/unverified. TLS, actual image build, visual browser QA and deployment resource enforcement remain external release gates. No secrets or customer records belong in this repository.

The research stage uses only user-supplied evidence and does not automatically browse or verify claims. Imported text is untrusted context, never permission for external action. Authorization to accept an artifact does not authorize publishing it.

Native Canvas memory is not bounded by the V8 heap flag. Deployment must enforce a container memory/CPU ceiling before enabling render. Source notices are retained; no redistributed music, voice samples, logos or customer uploads are included.

Next-stage source adds a renderer-specific structured visual plan and bounded creative correction. Plans support only trusted templates, neutral palette/motion presets and fixed compositions; not arbitrary 3D layers or the complete original art engine. Canvas script density and final CTA are validated before inference/render. Correction is disabled by default, limited to two attempts per job by server-only authorization, preserves version hashes and always retains final human review. Mock runtime tests are not evidence of real authenticated generation.

ElevenLabs/network contracts under connectors/ are review-only, excluded from images and unconnected. Their tests are mocks, not provider calls. Voice and publication remain unavailable; there is no active credit-approval UI, provider credential or synthesis HTTP endpoint. Provider-side spend enforcement and durable reconciliation must be implemented before enabling any paid transport.

The optional production/template-bridge source reuses the supplied amano Canvas2D primitives in two finite, new technical layouts. It is not packaged or exposed to runtime/model/user input. Two real local MP4 tests verify encoding/decode, not commercial or Three.js parity; synthetic palette/source approval is test-only.

### Primera prueba narrada de Glowfy

La producción `production/glowfy-production.mjs` une el guion orgánico real con la clave cifrada de la oficina, narración ElevenLabs Multilingual v2 con timestamps, escenas ilustradas propias, subtítulos, efectos de interfaz y mezcla medida. Se agrega únicamente `@napi-rs/canvas@0.1.100` al App por `Dockerfile.easypanel`; el trabajador de autenticación no se modifica.

Activación por administración: `OFFICE_AUTONOMY_ENABLED=1` y `OFFICE_AUTONOMY_JOB_IDS=<pieza>` autorizan el trabajo Codex; `OFFICE_VOICE_TEST_JOB_ID=<misma pieza Glowfy>` y `OFFICE_VOICE_ID=<voz premade consultada en el catálogo>` limitan la prueba de voz. Para una voz existente propia indicada explícitamente por Jorge, `OFFICE_VOICE_OWNER_AUTHORIZED=1` admite únicamente ese ID, sin crear ni clonar voz. Cada toma autorizada admite una sola solicitud de hasta 1000 créditos estimados mediante el factor del modelo y debe caber en la cuota incluida. No se habilita sobreconsumo, clonación, publicación ni generación para otras piezas. Cambiar el guion tras una síntesis no concede automáticamente otro consumo.

El ledger `speech-attempt.json` persiste antes de enviar la petición. Un resultado dudoso se bloquea sin reintentar; un resultado completo se reutiliza por hash para corregir el render. `beats.json`, audio, mapa de efectos, cuadros, MP4 y QA quedan en el volumen privado de videos. La prueba real se distingue de las pruebas unitarias con proveedores simulados. `awaiting_review` exige aprobación estética de Jorge; ni el score editorial ni la medición de LUFS la sustituyen.

### Corrección audiovisual solicitada por Jorge

La primera prueba fue rechazada por falta de música, efectos débiles y voz plana. La reedición usa el perfil `OFFICE_VOICE_PROFILE=social-v2` y, únicamente para la pieza ya autorizada, `OFFICE_VOICE_TEST_TAKE=2`. Conserva los archivos de la primera toma y registra la nueva en `voice-take-2/`. No habilita nuevas tomas por cambios de texto, reinicios o intentos repetidos.

El catálogo oficial de ElevenLabs determina modelos disponibles, compatibilidad de la voz profesional, controles y factor de consumo. La mezcla incorpora música y efectos existentes del estudio (procedencia en `production/audio/manifest.json`), sincronizados con las acciones, más ducking y medición final. La aprobación estética y la publicación siguen pendientes de Jorge. Las notas anteriores que describen ausencia de voz/música son registros históricos de etapas anteriores; no describen esta prueba acotada.

### Catálogo de efectos para revisión

El Estudio de Glowfy incluye un video de 4:16 con los 36 efectos existentes, comparando original y procesado, dos veces cada uno. Permite saltar a cada efecto y descargar el MP4 autenticado. Abrir `/?brand=glowfy#/estudio?efectos=1`; devolver número, A/B y problema. No regenera sonidos ni modifica piezas. Fuentes, método y comprobaciones: [catálogo SFX](production/sfx-catalog/README.md).
