#!/usr/bin/env bash
# ==============================================================================
# FLOW 01 — Remote Auth & Profile Reset (VPS Execution over SSH)
# Removes seeded users from PostgreSQL & MongoDB auth_db inside VPS containers
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
  echo "Usage: bash seeding_scripts/01_auth_profile_flow/remote_reset.sh --confirm"
  exit 1
fi

echo "🔄 1/2 Executing Flow 01 User Reset inside vibegrid_bff on ${VPS_HOST}..."
ssh "${VPS_HOST}" "
docker exec vibegrid_bff node -e '
const { PrismaClient } = require(\"@prisma/client\");
const p = new PrismaClient();
const adminEmail = process.env.ADMIN_EMAIL || \"admin@vibegrid.manakhly.tech\";
p.user.deleteMany({ where: { email: { not: adminEmail } } }).then(r => {
  console.log(\"   ✅ Deleted \" + r.count + \" non-admin user(s) from PostgreSQL\");
  return p.\$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
'
docker exec vibegrid_auth node -e '
const mongoose = require(\"mongoose\");
let uri = process.env.MONGO_URI;
if (uri && uri.includes(\"@\") && uri.startsWith(\"mongodb://\")) {
  const parts = uri.replace(\"mongodb://\", \"\").split(\"@\");
  const creds = parts[0].split(\":\");
  if (creds.length === 2) {
    const user = encodeURIComponent(decodeURIComponent(creds[0]));
    const pass = encodeURIComponent(decodeURIComponent(creds[1]));
    uri = \`mongodb://\${user}:\${pass}@\${parts[1]}\`;
  }
}
mongoose.connect(uri).then(() => {
  const adminEmail = process.env.ADMIN_EMAIL || \"admin@vibegrid.manakhly.tech\";
  return mongoose.connection.collection(\"userauths\").deleteMany({ email: { \$ne: adminEmail } });
}).then(r => {
  console.log(\"   ✅ Deleted \" + r.deletedCount + \" non-admin user(s) from Auth Mongo\");
  return mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
'
"

echo "🔄 2/2 Restarting vibegrid_auth to ensure bootstrap admins persist..."
ssh "${VPS_HOST}" "docker restart vibegrid_auth"
sleep 2

echo "✅ Flow 01 Remote Reset complete on ${VPS_HOST}."

