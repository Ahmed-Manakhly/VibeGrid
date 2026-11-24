#!/usr/bin/env bash
# ==============================================================================
# 03_SOCIAL_GRAPH_FLOW — Remote Reset (VPS Execution over SSH)
# Runs the canonical reset.js directly inside vibegrid_bff container
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
  echo "Usage: bash seeding_scripts/03_social_graph_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing 03_social_graph_flow Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec -i vibegrid_bff node -" < "${SCRIPT_DIR}/reset.js"
echo "✅ 03_social_graph_flow Remote Reset complete on ${VPS_HOST}."
