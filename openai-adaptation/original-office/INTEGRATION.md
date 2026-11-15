# Original shell + protected internal video workflow

> Actualización de esta rama (15 noviembre 2026): existe una conexión opt-in a un trabajador Codex por socket Unix. La imagen de runtime se construyó localmente y pasó comprobaciones sin cuenta real. Los párrafos históricos de abajo describen etapas anteriores; consultar [la entrega de implementación](deployment-review/IMPLEMENTACION.md) y [la evidencia actual](production/evidence/container-offline-check.md). No se desplegó esta entrega ni se realizó inferencia autenticada.

Local review build. No push, no deploy, no logged-in model or real AI generation has been verified.

## Real functionality
- Preserves original office canvas, rooms, navigation and visual styles with audited unavailable states.
- Optional video panel saves requests for five separate brands, with objective and CTA.
- Authenticated HTTP workflow connects to createVideoFlow: create/list/get/run/requestChanges/accept version+hash.
- API exposes artifact URL only, never absolute file path. Download authenticates, checks brand/job/version, real path confinement, MP4 kind/size and SHA256.
- Accept means accept_artifact_only, not publication. API has no publisher, credential setup or spending action. Paid calls, voice and cloning unsupported.
- Workflow storage and model runtime are separate. Server starts no model process and uses no adapter by default. Without connected runner, run persists blocked rather than inventing content.

## Deployment behavior
- Default: visual shell only, no video records. Enable internal workflow explicitly with OFFICE_ENABLE_VIDEO_WORKFLOW=1, OFFICE_VIDEO_DATA_DIR=/data/video on a dedicated UID1000 writable persistent volume. Preserve existing volumes; never share another service's data or tokens.
- Mandatory private OFFICE_PASSWORD>=16, exact HTTPS OFFICE_ORIGIN; HOST0.0.0.0 PORT3000. TLS still requires actual proxy/certificate verification. Dockerfile health is liveness only.
- Docker context this directory and Dockerfile. Explicit image whitelist excludes codex runtime, fixture tests, local renderer and any credentials. No npm install, paid SDK, model binary or outbound dependency.
- Codex adapter source included in review archive only for future integration/tests. Runtime activation is NOT wired into production start. Owner official login, process isolation and deployment-specific review remain required.
- FFmpeg renderer runs only when explicitly injected, which is done in tests, not default deployment. It produces a basic silent 360x640 animatic, not the finished creative quality of Diego's system.
- Single worker/replica. Set1CPU/512MiB initial ceiling within owner global limits. No actual Docker build or resource enforcement verified here.

## Test evidence
`node --test test.mjs video-http.test.mjs video/flow.test.mjs` passed24 tests after storage-hardening merge. Includes symlink/identity protections, atomic fsync persistence, per-store writer lock and caps.
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

Production interface update: five brands, per-stage provenance, technical QA vs owner acceptance, optional audience/channel/supplied evidence. Original hand-drawn primitives adapted with explicit color only; asset manifest excludes media/voice/logo reuse.28/28 tests; no new renderer connected. Managed restriction configuration now verified22/22 disabled in offline overlay, but actual tool inventory/adversarial sandbox remains unverified. See PACKAGING.md.

## Owner-reviewed material import
TXT only, at most 4 KiB, preview in local browser with textContent. File selection does not transmit bytes. Owner must explicitly approve inclusion in the selected brand brief before Save. Changing brand clears draft context/import and approval. Approved text persists in existing hardened per-brand job evidence, not as executable material. Filename is not sent. No multimedia ingestion, remote URL fetching, content execution, connector publication or new paid action. Credential pattern checks are best effort, not DLP; the user remains instructed to remove private information. Evidence is user supplied, not externally verified. Browser visual interaction remains unverified in this environment; pure import contract and actual server regression tests pass.

## Responsive workflow UX
Scoped CSS grid, stacked mobile breakpoint, labeled form fields, 44px controls, visible focus, stage cards and polite live status region. Original office/canvas unaffected. Static DOM/CSS contract tests only; no claim of browser visual QA.

## Next review: finite visual contract
Renderer profiles are supplied by the trusted adapter, not by client input. Script preflight enforces renderer scene count, text/word/line density and total duration before rendering. Art supports only a finite template, neutral palette, motion preset and fixed per-scene composition. No arbitrary JS, URLs, paths, assets or inferred brand colors. FFmpeg uses the plan's background/accent/fade; Canvas uses background/accent/transition pace. These are limited template controls, not the full original Three/Playwright art engine. `visualPlanApplied` records whether those controls were consumed, not a claim of visual quality or human acceptance. Default startup still has no Codex runner and remains blocked rather than simulating autonomous content.

## Bounded creative correction (source-only, off by default)
The optional trusted-server creativeRevision config permits at most two script corrections per job, only with recorded authorization source and a connected ChatGPT-plan runner reporting no paid API/publishing. Draft and previous-version snapshots are hashed and persisted before the next correction. The counter survives restart/manual revision and is not reset by those operations. Passing or exhausted review always returns to the owner; no artifact approval or external publication is automatic. The HTTP client cannot enable this policy. Current start.mjs does not configure it or connect a runner. Tests simulate provider status and responses; they do not demonstrate real inference, quota availability or performance. Persistent locks after crash still need explicit safe recovery; this is not a durable asynchronous worker queue.

## Text and history integrity correction
All FFmpeg drawtext inputs set expansion=none so percent signs and expansion-looking text remain literal. The regression renders a real MP4 with 'Ahorra 50% hoy' and checks visible glyph pixels in a decoded central frame, not just successful decoding. Current script hashes and automatic revision snapshot/nested script hashes are checked on every load; corrupted snapshots fail closed. These unkeyed hashes detect accidental corruption and do not authenticate a privileged writer who can recalculate them. Legacy/manual revisions without a recorded hash are not retroactively represented as verified. Exactly-once model execution across crash-before-save is not guaranteed; no automatic lock removal/retry was introduced.

## ElevenLabs connection contract only
`connectors/` is review source, excluded from Docker images and never imported by startup, HTTP or workflow. No provider implementation, transport, credentials, paid call, audio generation or active UI permission flow exists. Read-only capability/UX explicitly says voice disconnected and publication unavailable. The adapter's optional invocation requires injected verified connection/catalog, exact owner approval scope (account/brand/text/version/credit limit) and an atomic persistent attempt ledger. Tests use mock provider/ledger only. A supplied maxCredits plus response validation cannot enforce a provider-side spend ceiling; a real transport must establish an enforceable quote/limit and reconciliation before enablement. No automatic retries after an ambiguous result, no cloning and no publishing. Current service cannot accept a browser checkbox as credit approval.

## Original-primitives template bridge (review source only)
Two finite Canvas2D templates call the actual supplied amano primitives through the color-explicit wrapper. Their layouts are new, not the full original Three.js/Playwright engine. `compileTemplate` requires an operator-controlled brand/palette/source approval object, never an object authorized by model output. Both are labeled technical and NO PUBLICAR. No dynamic code/assets/URLs/voice. Source under production/ is not in either image, startup, API or agent catalog. Real local integration tests render each template to 3s540x960/24fps MP4, inspect72frames/noaudio and decode; template tests check deterministic seeks and brand mismatch. Tests use synthetic palette approval, not commercial brand approval. No browser visual QA, live inference or product-quality equivalence claimed. Native Canvas/font availability is still not validated in deployed image.
