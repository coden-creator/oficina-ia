#!/usr/bin/env bash
# Local verification only. No real login, no inference, no remote deployment.
set -euo pipefail
image=${1:?Usage: verify-runtime-container.sh IMAGE}
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
args=(run --rm --network none --read-only --cpus 1 --memory 512m --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,nosuid,nodev,size=64m)
docker "${args[@]}" "$image" node scripts/verify-tool-restrictions.mjs /usr/local/bin/codex
docker "${args[@]}" "$image" node scripts/probe-packaged-unauthenticated.mjs /usr/local/bin/codex
for tool in request_user_input view_image shell exec_command apply_patch unknown_tool; do
  docker "${args[@]}" --mount "type=bind,src=$script_dir/probe-tool-inventory.mjs,dst=/app/scripts/probe-tool-inventory.mjs,readonly" "$image" node scripts/probe-tool-inventory.mjs /usr/local/bin/codex --app-server "--attack=$tool"
done
