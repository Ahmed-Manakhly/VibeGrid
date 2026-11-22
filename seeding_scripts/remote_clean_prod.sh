#!/usr/bin/env bash
# ==============================================================================
# VibeGrid Production Multi-Database Remote Cleaner
# Executes clean scripts inside isolated containers on the VPS over SSH
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load seeding environment configuration if present
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${SCRIPT_DIR}/.env"
  set +a
fi

VPS_HOST="${VPS_SSH_HOST:-${VPS_HOST:-}}"

if [[ -z "${VPS_HOST}" ]]; then
  echo "❌ Error: VPS SSH Host is not configured."
  echo "   Please set VPS_SSH_HOST in seeding_scripts/.env or export VPS_HOST='user@your-vps-ip'."
  echo "   Example: echo 'VPS_SSH_HOST=root@your-vps-ip' >> seeding_scripts/.env"
  exit 1
fi

echo "=========================================================="
echo "⚠️  WARNING: Executing FULL Production Database Wipe on:"
echo "   Host: ${VPS_HOST}"
echo "=========================================================="

if [[ "${1:-}" != "--confirm" ]]; then
  echo "Aborted: Pass --confirm to execute the remote database wipe."
  echo "Usage: bash seeding_scripts/remote_clean_prod.sh --confirm"
  exit 1
fi

echo "🔥 1/3 Cleaning MongoDB (Auth Service) inside vibegrid_auth..."
ssh "${VPS_HOST}" "docker exec vibegrid_auth node scripts/clean_mongo.js --include-admins"

echo "🔥 2/3 Cleaning MongoDB (Media Service) inside vibegrid_media..."
ssh "${VPS_HOST}" "docker exec vibegrid_media node scripts/clean_media_mongo.js"

echo "🔥 3/3 Cleaning PostgreSQL & Redis inside vibegrid_bff..."
ssh "${VPS_HOST}" "docker exec vibegrid_bff node seeding_scripts/db_cleaners/clean_all.js --confirm"

echo "=========================================================="
echo "✅ All production databases wiped and reset successfully!"
echo "   Next step: Run forward seeding over HTTPS:"
echo "   node seeding_scripts/run_all.js prod all"
echo "=========================================================="
