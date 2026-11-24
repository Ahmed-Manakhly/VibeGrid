/**
 * FLOW 05 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded notifications & bookmarks, and clears session_state.json.
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

async function resetFlow05() {
  console.log('🔄 Resetting Flow 05 (Notifications & Bookmarks)...');

  try {
    let userIds = [];
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      if (session.users) {
        userIds = Object.values(session.users).map((u) => u.userId).filter(Boolean);
      }
    }

    if (userIds.length > 0) {
      const delNotif = await prisma.notifications.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { actorId: { in: userIds } },
          ],
        },
      });
      const delBm = await prisma.bookmark.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`   ✅ Deleted from PostgreSQL: ${delNotif.count} notification(s), ${delBm.count} bookmark(s).`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.notifications;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.notifications;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared notification session references.');
  await prisma.$disconnect();
}

resetFlow05();
