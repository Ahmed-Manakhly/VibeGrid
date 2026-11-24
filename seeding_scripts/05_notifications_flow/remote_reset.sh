#!/usr/bin/env bash
# ==============================================================================
# 05_NOTIFICATIONS_FLOW — Remote Reset (VPS Execution over SSH)
# Runs the canonical reset.js directly inside vibegrid_bff container,
# then replenishes bookmarks in local data_input.json from reference.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_SEEDING_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -f "${ROOT_SEEDING_DIR}/.env" ]]; then
  set -a
  source "${ROOT_SEEDING_DIR}/.env"
  set +a
fi

VPS_HOST="${VPS_SSH_HOST:-${VPS_HOST:-}}"

if [[ -z "${VPS_HOST}" ]]; then
  echo "❌ Error: VPS SSH Host is not configured."
  exit 1
fi

if [[ "${1:-}" != "--confirm" ]]; then
  echo "Aborted: Pass --confirm to execute the remote reset on VPS."
  echo "Usage: bash seeding_scripts/05_notifications_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing 05_notifications_flow Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec -i vibegrid_bff node -" < "${SCRIPT_DIR}/reset.js"
echo "✅ 05_notifications_flow Remote Reset complete on ${VPS_HOST}."

# Replenish Flow 05 slice in local data_input.json
node -e '
const fs = require("fs");
const path = require("path");
const refPath = path.join("'"${ROOT_SEEDING_DIR}"'", "data_reference.json");
const inPath = path.join("'"${ROOT_SEEDING_DIR}"'", "data_input.json");
if (fs.existsSync(refPath) && fs.existsSync(inPath)) {
  const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));
  const inp = JSON.parse(fs.readFileSync(inPath, "utf8"));
  inp.bookmarks = ref.bookmarks || [];
  fs.writeFileSync(inPath, JSON.stringify(inp, null, 2));
  console.log("📋 Replenished bookmarks in local data_input.json");
}
'
