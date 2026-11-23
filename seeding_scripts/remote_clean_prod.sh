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

echo "🔥 1/4 Cleaning MongoDB (Auth Service) inside vibegrid_auth..."
ssh "${VPS_HOST}" "docker exec vibegrid_auth node -e '
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
async function run() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.collection(\"userauths\").deleteMany({});
  console.log(\`   ✅ Auth Users — deleted \${result.deletedCount} document(s)\`);
  await mongoose.disconnect();
}
run().catch(e => { console.error(\"❌ Error:\", e); process.exit(1); });
'"

echo "🔄 2/4 Restarting vibegrid_auth to re-seed bootstrap admins (ensureBootstrapUsers)..."
ssh "${VPS_HOST}" "docker restart vibegrid_auth"
sleep 3

echo "🔥 3/4 Cleaning MongoDB (Media Service) inside vibegrid_media..."
ssh "${VPS_HOST}" "docker exec vibegrid_media node -e '
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
async function run() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.collection(\"mediaassets\").deleteMany({});
  console.log(\`   ✅ Media Assets — deleted \${result.deletedCount} document(s)\`);
  await mongoose.disconnect();
}
run().catch(e => { console.error(\"❌ Error:\", e); process.exit(1); });
'"

echo "🔥 4/4 Cleaning PostgreSQL & Redis inside vibegrid_bff..."
ssh "${VPS_HOST}" "docker exec vibegrid_bff node -e '
const { PrismaClient } = require(\"@prisma/client\");
const Redis = require(\"ioredis\");
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);
async function run() {
  const adminEmail = process.env.ADMIN_EMAIL || \"admin@vibegrid.manakhly.tech\";
  
  await prisma.directMessage.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notifications.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.pollVote.deleteMany({});
  await prisma.pollOption.deleteMany({});
  await prisma.poll.deleteMany({});
  await prisma.reGrid.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.postTag.deleteMany({});
  await prisma.tagFollow.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.communityMember.deleteMany({});
  await prisma.community.deleteMany({});
  await prisma.userInterest.deleteMany({});
  await prisma.follows.deleteMany({});
  await prisma.userBlock.deleteMany({});
  await prisma.userReport.deleteMany({});
  await prisma.developerMilestone.deleteMany({});
  await prisma.outboxEvent.deleteMany({});
  await prisma.vibe.deleteMany({});
  await prisma.category.deleteMany({});

  const u = await prisma.user.deleteMany({ where: { email: { not: adminEmail } } });
  console.log(\`   ✅ PostgreSQL non-admin users wiped: \${u.count}\`);
  console.log(\"   ✅ PostgreSQL Taxonomy (Categories & Vibes) wiped\");
  
  await redis.flushall();
  console.log(\"   ✅ Redis cache flushed\");

  await prisma.\$disconnect();
  await redis.quit();
}
run().catch(e => { console.error(\"❌ Error:\", e); process.exit(1); });
'"

echo "=========================================================="
echo "✅ All production databases wiped and reset successfully!"
echo "   Next step: Run forward seeding over HTTPS:"
echo "   node seeding_scripts/run_all.js prod all"
echo "=========================================================="
