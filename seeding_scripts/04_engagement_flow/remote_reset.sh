#!/usr/bin/env bash
# ==============================================================================
# FLOW 04 — Remote Engagement Reset (VPS Execution over SSH)
# Wipes seeded likes, comments, and votes inside vibegrid_bff on VPS
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
  echo "Usage: bash seeding_scripts/04_engagement_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing Flow 04 (Engagement) Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec vibegrid_bff node -e '
const { PrismaClient } = require(\"@prisma/client\");
const p = new PrismaClient();
Promise.all([
  p.like.deleteMany({}),
  p.commentLike.deleteMany({}),
  p.comment.deleteMany({}),
  p.pollVote.deleteMany({})
]).then(() => {
  console.log(\"   ✅ Engagement (likes, comments, votes) wiped from PostgreSQL\");
  return p.\$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
'"
echo "✅ Flow 04 Remote Reset complete on ${VPS_HOST}."

