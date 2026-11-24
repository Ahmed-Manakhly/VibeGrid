#!/usr/bin/env bash
# ==============================================================================
# 04_ENGAGEMENT_FLOW — Remote Reset (VPS Execution over SSH)
# Runs the canonical reset.js directly inside vibegrid_bff container,
# then replenishes engagement in local data_input.json from reference.
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
  echo "Usage: bash seeding_scripts/04_engagement_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing 04_engagement_flow Remote Reset on ${VPS_HOST}..."

# Step 1: Upload only DATA files to VPS via scp (small filenames, no ARG_MAX issue)
echo "   📤 Uploading data files to VPS..."
scp -o StrictHostKeyChecking=no \
  "${ROOT_SEEDING_DIR}/data_reference.json" \
  "${VPS_HOST}:/tmp/vg_data_reference.json"

if [[ -f "${ROOT_SEEDING_DIR}/session_state.json" ]]; then
  scp -o StrictHostKeyChecking=no \
    "${ROOT_SEEDING_DIR}/session_state.json" \
    "${VPS_HOST}:/tmp/vg_session_state.json"
fi

# Step 2: SSH to VPS — base64-encode data files there (local to VPS, no cross-machine arg overflow)
# Then pipe reset.js via stdin to `node -` so __dirname = /app (container WORKDIR) ✓
ssh -o StrictHostKeyChecking=no "${VPS_HOST}" '
  REF_B64=$(base64 -w 0 < /tmp/vg_data_reference.json 2>/dev/null || base64 < /tmp/vg_data_reference.json | tr -d "\r\n")
  SESS_B64=""
  [ -f /tmp/vg_session_state.json ] && \
    SESS_B64=$(base64 -w 0 < /tmp/vg_session_state.json 2>/dev/null || base64 < /tmp/vg_session_state.json | tr -d "\r\n")
  docker exec -i \
    -e "SEED_REF_B64=${REF_B64}" \
    -e "SEED_SESS_B64=${SESS_B64}" \
    vibegrid_bff node -
  rm -f /tmp/vg_data_reference.json /tmp/vg_session_state.json
' < "${SCRIPT_DIR}/reset.js"
echo "✅ 04_engagement_flow Remote Reset complete on ${VPS_HOST}."

# Replenish Flow 04 slice in local data_input.json
node -e '
const fs = require("fs");
const path = require("path");
const refPath = path.join("'"${ROOT_SEEDING_DIR}"'", "data_reference.json");
const inPath = path.join("'"${ROOT_SEEDING_DIR}"'", "data_input.json");
if (fs.existsSync(refPath) && fs.existsSync(inPath)) {
  const ref = JSON.parse(fs.readFileSync(refPath, "utf8"));
  const inp = JSON.parse(fs.readFileSync(inPath, "utf8"));
  inp.engagement = ref.engagement || {};
  fs.writeFileSync(inPath, JSON.stringify(inp, null, 2));
  console.log("📋 Replenished engagement in local data_input.json");
}
'
