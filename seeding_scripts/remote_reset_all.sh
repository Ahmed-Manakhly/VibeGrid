#!/usr/bin/env bash
# ==============================================================================
# Master Remote Bot-Only Reset Runner (VPS over SSH)
# ==============================================================================
# 🎯 TARGETED BOT CLEANER ON VPS:
# Executes each flow's remote_reset.sh in reverse order over SSH.
# Deletes ONLY bot-created fixtures (matching seed emails, slugs, post IDs).
# Real human manual users, posts, and UI data on production are PRESERVED.
#
# After remote reset finishes, it replenishes local data_input.json from
# data_reference.json and cleans session state.
#
# Usage:
#   bash seeding_scripts/remote_reset_all.sh --confirm
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
  exit 1
fi

echo "=========================================================="
echo "🎯 VibeGrid Remote Bot Reset (All Flows in Reverse Order)"
echo "   Target VPS: ${VPS_HOST}"
echo "   Scope: ONLY Bot Fixtures (Manual UI Users & Data Preserved)"
echo "=========================================================="

if [[ "${1:-}" != "--confirm" ]]; then
  echo "Aborted: Pass --confirm to execute the remote bot reset."
  echo "Usage: bash seeding_scripts/remote_reset_all.sh --confirm"
  exit 1
fi

FLOWS=(
  "07_messages_flow"
  "05_notifications_flow"
  "04_engagement_flow"
  "03_social_graph_flow"
  "02_posts_media_flow"
  "06_communities_flow"
  "01_auth_profile_flow"
  "00_taxonomy_flow"
)

TOTAL="${#FLOWS[@]}"
INDEX=1

for FLOW in "${FLOWS[@]}"; do
  FLOW_SCRIPT="${SCRIPT_DIR}/${FLOW}/remote_reset.sh"
  if [[ -f "${FLOW_SCRIPT}" ]]; then
    echo ""
    echo "[${INDEX}/${TOTAL}] 🔄 Remote resetting ${FLOW}..."
    bash "${FLOW_SCRIPT}" --confirm || echo "   ⚠️ Warning: ${FLOW} returned non-zero code. Continuing."
  else
    echo "   ⚠️ Notice: ${FLOW_SCRIPT} missing. Skipping."
  fi
  INDEX=$((INDEX + 1))
done

# Replenish local consumable data_input.json from master data_reference.json
if [[ -f "${SCRIPT_DIR}/data_reference.json" ]]; then
  cp "${SCRIPT_DIR}/data_reference.json" "${SCRIPT_DIR}/data_input.json"
  echo ""
  echo "📋 Master data_input.json replenished from data_reference.json"
fi

# Clean local session state files
rm -f "${SCRIPT_DIR}/session_state.json"
rm -f "${SCRIPT_DIR}"/*_flow/session_state.json 2>/dev/null || true
echo "🧹 Cleaned local session_state.json files"

echo ""
echo "=========================================================="
echo "🎉 Remote Bot Reset Complete on VPS!"
echo "   All bot fixtures removed over SSH."
echo "   Real manual users & UI data preserved."
echo "   Local data_input.json queue is full and ready for forward seed."
echo "=========================================================="

