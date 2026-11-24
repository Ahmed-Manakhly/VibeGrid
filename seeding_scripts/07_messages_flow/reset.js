/**
 * FLOW 07 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded conversations & messages, and clears session_state.json.
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

async function resetFlow07() {
  console.log('🔄 Resetting Flow 07 (Direct Messaging)...');

  try {
    let userIds = [];
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      if (session.users) {
        userIds = Object.values(session.users).map((u) => u.userId).filter(Boolean);
      } else {
        userIds = Object.entries(session)
          .filter(([k, v]) => k.startsWith('user_') && v && v.userId)
          .map(([, v]) => v.userId);
      }
    }

    if (userIds.length > 0) {
      const delMsg = await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: { in: userIds } },
            { recipientId: { in: userIds } },
          ],
        },
      });
      const delConv = await prisma.conversation.deleteMany({
        where: {
          OR: [
            { user1Id: { in: userIds } },
            { user2Id: { in: userIds } },
          ],
        },
      });
      console.log(`   ✅ Deleted from PostgreSQL: ${delMsg.count} message(s), ${delConv.count} conversation(s).`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.conversations;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.conversations;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared direct conversation session references.');

  // Replenish conversations slice in data_input.json
  const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(REFERENCE_PATH) && fs.existsSync(INPUT_PATH)) {
    try {
      const ref = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      if (Array.isArray(ref.conversations)) {
        inp.conversations = ref.conversations;
        fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
        console.log('   📋 Replenished conversations in data_input.json from data_reference.json');
      }
    } catch (e) {}
  }

  await prisma.$disconnect();
}

resetFlow07();
