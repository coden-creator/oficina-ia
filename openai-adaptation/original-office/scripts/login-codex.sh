#!/usr/bin/env bash
# Owner-operated official login. No model turn, API key or publication.
set -euo pipefail
if [[ $# -ne 2 ]]; then
  echo 'Uso: bash scripts/login-codex.sh IMAGEN_VERIFICADA VOLUMEN_PRIVADO' >&2
  exit 2
fi
office_image=$1
office_auth_volume=$2
if [[ ! $office_auth_volume =~ ^[a-z0-9][a-z0-9_-]+$ ]]; then
  echo 'Nombre de volumen privado inválido.' >&2; exit 2
fi
docker image inspect "$office_image" >/dev/null
common=(--rm --no-healthcheck --user 1000:1000 --read-only --cpus 1 --memory 512m --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,nosuid,nodev,size=64m)
# The image must pass its configuration check before an auth volume is mounted.
docker run "${common[@]}" --network none "$office_image" node scripts/verify-tool-restrictions.mjs /usr/local/bin/codex
if docker volume inspect "$office_auth_volume" >/dev/null 2>&1; then
  purpose=$(docker volume inspect --format '{{index .Labels "office.purpose"}}' "$office_auth_volume")
  if [[ $purpose != 'jorge-codex-auth' ]]; then
    echo 'El volumen existente no está identificado como el volumen privado de este login; se conserva sin cambios.' >&2; exit 1
  fi
else
  docker volume create --label office.purpose=jorge-codex-auth "$office_auth_volume" >/dev/null
fi
login_args=("${common[@]}" --mount "type=volume,src=$office_auth_volume,dst=/home/node/codex-isolated" -e HOME=/home/node/codex-isolated -e CODEX_HOME=/home/node/codex-isolated --entrypoint /usr/local/bin/codex)
echo 'Abrí el enlace oficial de OpenAI que aparece abajo e ingresá el código en tu navegador. No compartas el código ni los archivos de sesión.'
docker run -it "${login_args[@]}" "$office_image" login --device-auth
docker run "${login_args[@]}" --network none "$office_image" login status
echo "Sesión guardada en el volumen privado: $office_auth_volume"
echo 'La oficina todavía no se conecta automáticamente. Configurar este mismo volumen como OFFICE_AUTH_VOLUME del trabajador.'
