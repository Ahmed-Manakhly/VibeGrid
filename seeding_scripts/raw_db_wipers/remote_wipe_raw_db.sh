#!/usr/bin/env bash
# ==============================================================================
# VibeGrid Production Multi-Database Remote Raw Wiper (Disaster Recovery / Bare Metal)
# ==============================================================================
# ⚠️  DANGER: This script is a NUCLEAR DATABASE WIPER, NOT A SEEDING RESET.
# It destroys 100% of all data across all datastores on the VPS:
#   1. Auth MongoDB:     vibegrid_auth (clean_mongo.js --include-admins)
#   2. Auth Restart:     restarts container to re-seed initial clean bootstrap admin
#   3. Media MongoDB:    vibegrid_media (clean_media_mongo.js)
#   4. PostgreSQL/Redis: vibegrid_bff (wipe_postgres_redis.js --confirm --include-admins)
#
# It is completely decoupled from data_input.json, data_reference.json, and bots.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_SEEDING_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load seeding environment configuration if present
if [[ -f "${ROOT_SEEDING_DIR}/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT_SEEDING_DIR}/.env"
  set +a
fi

VPS_HOST="${VPS_SSH_HOST:-${VPS_HOST:-}}"

if [[ -z "${VPS_HOST}" ]]; then
  echo "❌ Error: VPS SSH Host is not configured."
  echo "   Please set VPS_SSH_HOST in seeding_scripts/.env or export VPS_HOST='user@your-vps-ip'."
  exit 1
fi

echo "=========================================================="
echo "⚠️  WARNING: Executing NUCLEAR Database Wipe on VPS:"
echo "   Host: ${VPS_HOST}"
echo "   This will DELETE ALL USERS (real + bots), POSTS, MEDIA, & CACHE."
echo "=========================================================="

if [[ "${1:-}" != "--confirm" ]]; then
  echo "Aborted: Pass --confirm to execute the remote database wipe."
  echo "Usage: bash seeding_scripts/raw_db_wipers/remote_wipe_raw_db.sh --confirm"
  exit 1
fi

echo "🔥 1/4 Cleaning MongoDB (Auth Service) via scripts/clean_mongo.js..."
ssh "${VPS_HOST}" "docker exec vibegrid_auth node scripts/clean_mongo.js --include-admins"

echo "🔄 2/4 Restarting vibegrid_auth to re-seed clean bootstrap admin..."
ssh "${VPS_HOST}" "docker restart vibegrid_auth"
sleep 3

echo "🔥 3/4 Cleaning MongoDB (Media Service) via scripts/clean_media_mongo.js..."
ssh "${VPS_HOST}" "docker exec vibegrid_media node scripts/clean_media_mongo.js"

echo "🔥 4/4 Cleaning PostgreSQL & Redis (BFF) via wipe_postgres_redis.js..."
ssh "${VPS_HOST}" "docker exec -i vibegrid_bff node - --confirm --include-admins" < "${SCRIPT_DIR}/wipe_postgres_redis.js"

echo "=========================================================="
echo "✅ All production databases wiped to bare metal successfully!"
echo "   Databases are 100% empty and clean."
echo "=========================================================="

