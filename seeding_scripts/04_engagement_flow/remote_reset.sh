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

# Encode reference data & session state if present
REF_B64=""
if [[ -n "${SEED_REF_B64:-}" ]]; then
  REF_B64="${SEED_REF_B64}"
elif [[ -f "${ROOT_SEEDING_DIR}/data_reference.json" ]]; then
  REF_B64=$(base64 -w 0 < "${ROOT_SEEDING_DIR}/data_reference.json" 2>/dev/null || base64 < "${ROOT_SEEDING_DIR}/data_reference.json" | tr -d '\r\n')
fi

SESS_B64=""
if [[ -n "${SEED_SESS_B64:-}" ]]; then
  SESS_B64="${SEED_SESS_B64}"
elif [[ -f "${ROOT_SEEDING_DIR}/session_state.json" ]]; then
  SESS_B64=$(base64 -w 0 < "${ROOT_SEEDING_DIR}/session_state.json" 2>/dev/null || base64 < "${ROOT_SEEDING_DIR}/session_state.json" | tr -d '\r\n')
elif [[ -f "${SCRIPT_DIR}/session_state.json" ]]; then
  SESS_B64=$(base64 -w 0 < "${SCRIPT_DIR}/session_state.json" 2>/dev/null || base64 < "${SCRIPT_DIR}/session_state.json" | tr -d '\r\n')
fi

echo "🔄 Executing 04_engagement_flow Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec -i -e SEED_REF_B64='${REF_B64}' -e SEED_SESS_B64='${SESS_B64}' vibegrid_bff node -" < "${SCRIPT_DIR}/reset.js"
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
