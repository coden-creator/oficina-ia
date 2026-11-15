# Original shell + protected internal video workflow

> Estado verificado (15 noviembre 2026): Jorge completó el login oficial; el trabajador privado de Codex ya está desplegado y Docker lo reportó saludable. La web de revisión y el trabajador están saludables. La ficha Glowfy, versión 2, completó las cinco etapas con Codex real y generó un MP4 silencioso de 9 segundos; descarga, SHA256 y decodificación comprobados. Permanece pendiente de aprobación de Jorge. Ver [evidencia del video real](production/evidence/first-real-video.json). La entrega vigente usa un trabajador Compose y una web Swarm porque CodeNet no es attachable. Consultar [IMPLEMENTACION.md](deployment-review/IMPLEMENTACION.md) para el procedimiento y los límites actuales. Los apartados posteriores conservan evidencia histórica; no describen por sí solos el despliegue vigente.

Historical review-build notes follow; current deployment status is recorded above.

## Real functionality
- Preserves original office canvas, rooms, navigation and visual styles with audited unavailable states.
- Optional video panel saves requests for five separate brands, with objective and CTA.
- Authenticated HTTP workflow connects to createVideoFlow: create/list/get/run/requestChanges/accept version+hash.
- API exposes artifact URL only, never absolute file path. Download authenticates, checks brand/job/version, real path confinement, MP4 kind/size and SHA256.
- Accept means accept_artifact_only, not publication. API has no publisher, credential setup or spending action. Paid calls, voice and cloning unsupported.
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
