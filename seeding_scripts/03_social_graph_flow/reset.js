/**
 * FLOW 03 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded follow relationships and clears session_state.json.
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

async function resetFlow03() {
  console.log('🔄 Resetting Flow 03 (Social Graph)...');

  try {
    let userIds = [];
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      if (session.users) {
        userIds = Object.values(session.users).map((u) => u.userId).filter(Boolean);
      }
    }

    if (userIds.length > 0) {
      const del = await prisma.follows.deleteMany({
        where: {
          OR: [
            { followerId: { in: userIds } },
            { followingId: { in: userIds } },
          ],
        },
      });
      console.log(`   ✅ Deleted ${del.count} seeded Follow relationships from PostgreSQL.`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.socialGraph;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.socialGraph;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared social graph session references.');

  // Replenish socialGraph slice in data_input.json
  const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(REFERENCE_PATH) && fs.existsSync(INPUT_PATH)) {
    try {
      const ref = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      if (Array.isArray(ref.socialGraph)) {
        inp.socialGraph = ref.socialGraph;
        fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
        console.log('   📋 Replenished socialGraph in data_input.json from data_reference.json');
      }
    } catch (e) {}
  }

  await prisma.$disconnect();
}

resetFlow03();
