/**
 * FLOW 05 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded notifications & bookmarks where user or actor/creator email matches seed users.
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

async function resetFlow05() {
  console.log('🔄 Resetting Flow 05 (Notifications & Bookmarks)...');

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

    const notifWhere = {
      OR: [
        ...(seedEmails.length > 0 ? [
          { user: { email: { in: seedEmails } } },
          { creator: { email: { in: seedEmails } } },
        ] : []),
        ...(userIds.length > 0 ? [
          { userId: { in: userIds } },
          { creatorId: { in: userIds } },
        ] : []),
      ],
    };

    const bmWhere = {
      OR: [
        ...(seedEmails.length > 0 ? [{ user: { email: { in: seedEmails } } }] : []),
        ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
      ],
    };

    if (notifWhere.OR.length > 0) {
      const delNotif = await prisma.notifications.deleteMany({ where: notifWhere });
      console.log(`   ✅ Notifications — deleted ${delNotif.count} row(s)`);
    }

    if (bmWhere.OR.length > 0) {
      const delBm = await prisma.bookmark.deleteMany({ where: bmWhere });
      console.log(`   ✅ Bookmark — deleted ${delBm.count} row(s)`);
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
      delete session.notifications;
      fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }
  if (fs.existsSync(FLOW_SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
      delete session.notifications;
      fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }

  // Replenish bookmarks slice in data_input.json if local files exist
  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && Array.isArray(refData.bookmarks)) {
    try {
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inp.bookmarks = refData.bookmarks;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
      console.log('   📋 Replenished bookmarks in data_input.json from reference data.');
    } catch (e) {}
  }

  console.log('✅ Flow 05 Reset complete.\n');
  await prisma.$disconnect();
}

resetFlow05().catch((e) => {
  console.error('❌ FLOW 05 Reset failed:', e.message);
  process.exit(1);
});
