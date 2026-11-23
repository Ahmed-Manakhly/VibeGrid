#!/usr/bin/env bash
# ==============================================================================
# FLOW 05 — Remote Notifications & Bookmarks Reset (VPS Execution over SSH)
# Wipes seeded notifications and bookmarks inside vibegrid_bff on VPS
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
  echo "   Please set VPS_SSH_HOST in seeding_scripts/.env or export VPS_HOST='user@your-vps-ip'."
  exit 1
fi

if [[ "${1:-}" != "--confirm" ]]; then
  echo "Aborted: Pass --confirm to execute the remote reset on VPS."
  echo "Usage: bash seeding_scripts/05_notifications_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing Flow 05 (Notifications) Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec vibegrid_bff node seeding_scripts/05_notifications_flow/reset.js"
echo "✅ Flow 05 Remote Reset complete on ${VPS_HOST}."

