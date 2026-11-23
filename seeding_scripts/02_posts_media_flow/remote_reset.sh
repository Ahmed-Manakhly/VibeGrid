#!/usr/bin/env bash
# ==============================================================================
# FLOW 02 — Remote Posts Reset (VPS Execution over SSH)
# Wipes seeded posts and cascaded records inside vibegrid_bff on VPS
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
  echo "Usage: bash seeding_scripts/02_posts_media_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 Executing Flow 02 (Posts) Remote Reset on ${VPS_HOST}..."
ssh "${VPS_HOST}" "docker exec vibegrid_bff node -e '
const { PrismaClient } = require(\"@prisma/client\");
const p = new PrismaClient();
Promise.all([
  p.bookmark.deleteMany({}),
  p.pollVote.deleteMany({}),
  p.pollOption.deleteMany({}),
  p.poll.deleteMany({}),
  p.reGrid.deleteMany({}),
  p.like.deleteMany({}),
  p.commentLike.deleteMany({}),
  p.comment.deleteMany({}),
  p.postTag.deleteMany({}),
  p.post.deleteMany({})
]).then(() => {
  console.log(\"   ✅ Posts, polls, comments, and media links wiped from PostgreSQL\");
  return p.\$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
'"
echo "✅ Flow 02 Remote Reset complete on ${VPS_HOST}."

