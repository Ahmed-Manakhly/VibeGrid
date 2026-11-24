/**
 * FLOW 03 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded follow relationships where follower or following email is in seed user emails.
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  const candidateEnvPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'seeding_scripts/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try { require('dotenv').config({ path: envPath }); break; } catch (e) {}
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function loadReferenceData() {
  if (process.env.SEED_REF_B64) {
    try {
      const decoded = Buffer.from(process.env.SEED_REF_B64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse SEED_REF_B64:', e.message);
    }
  }
  const candidatePaths = [
    path.join(__dirname, '..', 'data_reference.json'),
    path.join(__dirname, 'data_reference.json'),
    path.join(process.cwd(), 'seeding_scripts', 'data_reference.json'),
    path.join(process.cwd(), 'data_reference.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
    }
  }
  return {};
}

function loadSessionData() {
  if (process.env.SEED_SESS_B64) {
    try {
      const decoded = Buffer.from(process.env.SEED_SESS_B64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse SEED_SESS_B64:', e.message);
    }
  }
  const candidatePaths = [
    path.join(__dirname, '..', 'session_state.json'),
    path.join(__dirname, 'session_state.json'),
    path.join(process.cwd(), 'seeding_scripts', 'session_state.json'),
    path.join(process.cwd(), 'session_state.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
    }
  }
  return {};
}

async function resetFlow03() {
  console.log('🔄 Resetting Flow 03 (Social Graph)...');

  try {
    const refData = loadReferenceData();
    const sessionData = loadSessionData();
    const seedEmails = Array.isArray(refData.users) ? refData.users.map((u) => u.email).filter(Boolean) : [];

    let userIds = [];
    if (sessionData) {
      if (sessionData.users) {
        userIds = Object.values(sessionData.users).map((u) => u.userId).filter(Boolean);
      } else {
        userIds = Object.entries(sessionData)
          .filter(([k, v]) => k.startsWith('user_') && v && v.userId)
          .map(([, v]) => v.userId);
      }
    }

    if (seedEmails.length > 0) {
      try {
        const dbUsers = await prisma.user.findMany({
          where: { email: { in: seedEmails } },
          select: { id: true },
        });
        for (const u of dbUsers) {
          if (u.id && !userIds.includes(u.id)) {
            userIds.push(u.id);
          }
        }
      } catch (err) {
        console.warn(`   ⚠️ Could not query users by email: ${err.message}`);
      }
    }

    const whereClause = {
      OR: [
        ...(seedEmails.length > 0 ? [
          { follower: { email: { in: seedEmails } } },
          { following: { email: { in: seedEmails } } },
        ] : []),
        ...(userIds.length > 0 ? [
          { followerId: { in: userIds } },
          { followingId: { in: userIds } },
        ] : []),
      ],
    };

    if (whereClause.OR.length > 0) {
      const del = await prisma.follows.deleteMany({ where: whereClause });
      console.log(`   ✅ Deleted ${del.count} seeded Follow relationships from PostgreSQL.`);
    } else {
      console.log('   ℹ No seed users or emails identified for social graph reset.');
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  // Clear local session references if files exist on disk
  const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
  const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');
  if (fs.existsSync(SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      delete session.socialGraph;
      fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }
  if (fs.existsSync(FLOW_SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
      delete session.socialGraph;
      fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }

  // Replenish socialGraph slice in data_input.json if local files exist
  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && Array.isArray(refData.socialGraph)) {
    try {
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inp.socialGraph = refData.socialGraph;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
      console.log('   📋 Replenished socialGraph in data_input.json from reference data.');
    } catch (e) {}
  }

  console.log('✅ Flow 03 Reset complete.\n');
  await prisma.$disconnect();
}

resetFlow03().catch((e) => {
  console.error('❌ FLOW 03 Reset failed:', e.message);
  process.exit(1);
});
