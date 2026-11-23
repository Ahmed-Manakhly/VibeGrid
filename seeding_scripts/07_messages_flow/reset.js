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
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
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
  await prisma.$disconnect();
}

resetFlow07();
