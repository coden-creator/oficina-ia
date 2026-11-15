# Runtime packaging: prepared, not deployed or authenticated

> Corrección creativa: Jorge rechazó el acabado de tarjetas y fijó dos referencias como mínimo audiovisual. Ver [directrices vigentes](production/ESTANDAR-AUDIOVISUAL.md). La prueba de conexión sigue siendo evidencia técnica, no aceptación del video.

> Estado verificado (15 noviembre 2026): Jorge completó el login oficial; el trabajador privado de Codex ya está desplegado y Docker lo reportó saludable. La web de revisión y el trabajador están saludables. La ficha Glowfy, versión 2, completó las cinco etapas con Codex real y generó un MP4 silencioso de 9 segundos; descarga, SHA256 y decodificación comprobados. Permanece pendiente de aprobación de Jorge. Ver [evidencia del video real](production/evidence/first-real-video.json). La entrega vigente usa un trabajador Compose y una web Swarm porque CodeNet no es attachable. Consultar [IMPLEMENTACION.md](deployment-review/IMPLEMENTACION.md) para el procedimiento y los límites actuales. Los apartados posteriores conservan evidencia histórica; no describen por sí solos el despliegue vigente.

## Verified inputs
- Official npm `@openai/codex@0.167.0-alpha.4`; package-lock includes platform packages with SHA512 integrity. `npm ci --ignore-scripts` succeeded in the build investigation environment.
- Exact binary from that downloaded npm package responded `codex-cli 0.167.0-alpha.4`; fresh-home app-server initialize and account/read succeeded with account:null. No login, thread turn or inference performed.
- Native package layout is `vendor/<target>/bin/codex`. Preserve the whole vendor directory (resources and code-mode-host), not a guessed single-file path. Dockerfile.runtime does this.
- Debian Bookworm FFmpeg version selected from official package source: `7:5.1.9-0+deb12u1` (https://packages.debian.org/bookworm/ffmpeg). Exact install fails closed if unavailable, no unpinned fallback.
- npm source https://www.npmjs.com/package/@openai/codex and official Codex app-server docs https://learn.chatgpt.com/docs/app-server . No third-party installers.

## Prepared image
`docker build -f Dockerfile.runtime -t oficina-runtime:review .`

Image installs pinned Codex and FFmpeg, carries the original shell, reviewed video workflow, local renderer and adapter source. Node base fixed tag22.16.0-bookworm-slim; its immutable digest and OS dependency snapshot are NOT pinned yet. Image is not bit-for-bit reproducible and actual Docker build/scan is still unverified because Docker is unavailable here. Record final digest/SBOM and scan before deployment.

It runs UID1000, port3000. Data path `/data/video` must be a dedicated writable persistent volume. Optional workflow enabled via OFFICE_ENABLE_VIDEO_WORKFLOW=1. Optional local renderer only via OFFICE_ENABLE_LOCAL_RENDER=1. Renderer cannot produce a video without a runner completing stages; no fixture runner is in startup/image.

Default startup does not connect Codex. Merely installing CLI is not a functioning authenticated model integration. Separate runtime activation must be reviewed and verified, not inferred from these successful tests.

## Blocking security discovery
The exact CLI accepts --disable flags, but observed `features list` can still report unified_exec=true. Managed requirements may be necessary. `sandbox=readOnly` and `approvalPolicy=untrusted` do not isolate reads of authentication files or prevent every shell execution. Instructions saying text-only are not an access boundary.

Do not put owner credentials in this image or enable an authenticated runtime until managed tool restrictions, separate private process/container resources and adversarial access tests are verified. Do not mount Docker socket, other service volumes, host root or existing ambient config. New security/network permission changes require approval.

## Reproducible no-auth probe
`node scripts/probe-packaged-unauthenticated.mjs /usr/local/bin/codex`

Creates fresh private temporary HOME/workspace, passes no inherited credentials, initializes transport, calls account/read only, requires null account, then closes and cleans up. Output explicitly reports toolIsolationVerified:false. This checks protocol compatibility, NOT tool isolation, model entitlement, quota, actual model generation or safety of an authenticated runtime.

## Still needed
1. Build actual image, verify pinned binaries/resources/fonts and native smoke tests in it.
2. Enforce/audit tool restrictions and filesystem/network confinement; reject attempts to read auth/config/other brands or execute shell/network.
3. Obtain official owner login through supported flow only after isolation passes.
4. Attach genuine Codex runner, verify typed output for every specialist and real rendered artifact, then visual owner QA.
5. Publish only by separate explicit authorization. No paid fallback, cloning or external action is enabled here.

## Added enforcement recipe and actual gate result
Dockerfile.runtime now copies staged requirements.toml to /etc/codex root-owned (image only), then runs scripts/verify-tool-restrictions.mjs as non-root during build. This fails unless every configured disable flag is visibly false. Running that script against the downloaded npm binary on the current host returned configurationGatePassed:false, enabledOrMissing:[unified_exec], without auth/inference. This expected failure is a real remaining security blocker, not a passing isolation test. Requirements have not been applied to this host or validated in a built image.

## Subsequent managed configuration evidence
The parallel CLI investigation verified the staged managed requirements in a bwrap overlay without modifying host policy:22/22 features false, attempted CLI re-enable of unified_exec and shell_tool remained false, strict startup passed. Exact evidence copied to production/evidence/managed-restrictions.json. This resolves the configuration-precedence uncertainty only. Network namespace was unavailable; inventory/adversarial harness stopped before a model request due sandbox helper socket ownership error. No sandbox bypass, credentials or inference occurred. Actual isolated image build and authenticated tool-isolation acceptance remain pending.

## Optional Canvas laboratory adapter (disabled)
`OFFICE_ENABLE_CANVAS_DEMO=1` additionally requires `OFFICE_CANVAS_DEPENDENCIES_VERIFIED=1` and cannot coexist with local-render flag. This operator declaration is not proof: deployment must first verify native @napi-rs/canvas 0.1.100, FFmpeg, fonts and sandbox. Images currently do not install Canvas, so DO NOT set these flags in a release yet. No Codex runner is connected by enabling a renderer. Jobs require explicit `style: technical-canvas-demo`; UI displays the resulting artifact as a technical illustration, not real product UI or final commercial production. There is intentionally no one-click default demo generation or fake agents. HTTP supports authenticated/hash-checked MP4 kind technical_canvas_demo and silent_animatic only. POSIX owned-process-group supervisor terminates worker/descendants on timeout/output caps and awaits closure, with regression tests; this does not prove cgroup/network isolation. The real HTTP test uses fixture specialist outputs, never model inference.
