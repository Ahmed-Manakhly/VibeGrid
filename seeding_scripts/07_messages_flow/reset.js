/**
 * FLOW 07 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded conversations, direct messages, and participants where participant
 * emails match seed users.
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

async function resetFlow07() {
  console.log('🔄 Resetting Flow 07 (Direct Messaging)...');

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

    let convIds = [];
    if (sessionData && sessionData.conversations) {
      convIds = Object.values(sessionData.conversations).map((c) => c.id).filter(Boolean);
    }

    try {
      const participantWhere = {
        OR: [
          ...(seedEmails.length > 0 ? [{ user: { email: { in: seedEmails } } }] : []),
          ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
        ],
      };
      if (participantWhere.OR.length > 0) {
        const participants = await prisma.conversationParticipant.findMany({
          where: participantWhere,
          select: { conversationId: true },
        });
        for (const p of participants) {
          if (p.conversationId && !convIds.includes(p.conversationId)) {
            convIds.push(p.conversationId);
          }
        }
      }
    } catch (err) {
      console.warn(`   ⚠️ Could not query conversation participants: ${err.message}`);
    }

    if (convIds.length > 0) {
      const delMsg = await prisma.directMessage.deleteMany({
        where: { conversationId: { in: convIds } },
      });
      const delPart = await prisma.conversationParticipant.deleteMany({
        where: { conversationId: { in: convIds } },
      });
      const delConv = await prisma.conversation.deleteMany({
        where: { id: { in: convIds } },
      });
      console.log(`   ✅ Deleted from PostgreSQL: ${delMsg.count} message(s), ${delPart.count} participant(s), ${delConv.count} conversation(s).`);
    } else {
      console.log('   ℹ No conversations matching seed participants found.');
    }

    if (seedEmails.length > 0 || userIds.length > 0) {
      const msgWhere = {
        OR: [
          ...(seedEmails.length > 0 ? [{ sender: { email: { in: seedEmails } } }] : []),
          ...(userIds.length > 0 ? [{ senderId: { in: userIds } }] : []),
        ],
      };
      const orphanMsgs = await prisma.directMessage.deleteMany({ where: msgWhere }).catch(() => ({ count: 0 }));
      if (orphanMsgs.count > 0) {
        console.log(`   ✅ Deleted ${orphanMsgs.count} additional message(s) by seed senders.`);
      }
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
      delete session.conversations;
      fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }
  if (fs.existsSync(FLOW_SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
      delete session.conversations;
      fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }

  // Replenish conversations slice in data_input.json if local files exist
  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && Array.isArray(refData.conversations)) {
    try {
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inp.conversations = refData.conversations;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
      console.log('   📋 Replenished conversations in data_input.json from reference data.');
    } catch (e) {}
  }

  console.log('✅ Flow 07 Reset complete.\n');
  await prisma.$disconnect();
}

resetFlow07().catch((e) => {
  console.error('❌ FLOW 07 Reset failed:', e.message);
  process.exit(1);
});
