/**
 * FLOW 04 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded likes, comments, and poll votes, and clears session_state.json.
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) { try { require('dotenv').config({ path: envPath }); break; } catch (e) {} }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

async function resetFlow04() {
  console.log('🔄 Resetting Flow 04 (Engagement)...');

  try {
    let userIds = [];
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      if (session.users) {
        userIds = Object.values(session.users).map((u) => u.userId).filter(Boolean);
      }
    }

    if (userIds.length > 0) {
      const delVotes = await prisma.pollVote.deleteMany({ where: { userId: { in: userIds } } });
      const delLikes = await prisma.like.deleteMany({ where: { userId: { in: userIds } } });
      const delComments = await prisma.comment.deleteMany({ where: { authorId: { in: userIds } } });
      console.log(`   ✅ Deleted engagement from PostgreSQL: ${delLikes.count} like(s), ${delComments.count} comment(s), ${delVotes.count} vote(s).`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.engagement;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.engagement;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared engagement session references.');

  // Replenish engagement slice in data_input.json
  const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(REFERENCE_PATH) && fs.existsSync(INPUT_PATH)) {
    try {
      const ref = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      if (ref.engagement) {
        inp.engagement = ref.engagement;
        fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
        console.log('   📋 Replenished engagement in data_input.json from data_reference.json');
      }
    } catch (e) {}
  }

  await prisma.$disconnect();
}

resetFlow04();
