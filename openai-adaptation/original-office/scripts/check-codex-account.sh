#!/usr/bin/env bash
# Runs only account/catalog reads using the existing owner's private volume.
set -euo pipefail
if [[ $# -ne 2 ]]; then
  echo 'Uso: bash scripts/check-codex-account.sh IMAGEN_VERIFICADA VOLUMEN_PRIVADO' >&2
  exit 2
fi
office_image=$1
office_auth_volume=$2
if [[ ! $office_auth_volume =~ ^[a-z0-9][a-z0-9_-]+$ ]]; then
  echo 'Nombre de volumen privado inválido.' >&2; exit 2
fi
docker image inspect "$office_image" >/dev/null
purpose=$(docker volume inspect --format '{{index .Labels "office.purpose"}}' "$office_auth_volume")
if [[ $purpose != 'jorge-codex-auth' ]]; then
  echo 'No se reconoce este volumen como el login privado de Jorge.' >&2; exit 1
fi
office_script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
docker run --rm --no-healthcheck --user 1000:1000 --read-only \
  --cpus 1 --memory 512m --cap-drop ALL --security-opt no-new-privileges \
  --tmpfs /tmp:rw,nosuid,nodev,size=64m \
  --mount "type=volume,src=$office_auth_volume,dst=/home/node/codex-isolated" \
  --mount "type=bind,src=$office_script_dir/check-codex-account.mjs,dst=/app/scripts/check-codex-account.mjs,readonly" \
  "$office_image" node scripts/check-codex-account.mjs
