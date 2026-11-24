/**
 * FLOW 02 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma (ports accessible on localhost).
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded posts, attachments, comments, likes, tags, and clears session_state.json.
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

async function resetFlow02() {
  console.log('🔄 Resetting Flow 02 (Posts & Media)...');

  try {
    let postIds = [];
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
      if (session.posts) {
        postIds = Object.values(session.posts).map((p) => p.id).filter(Boolean);
      }
    }

    if (postIds.length > 0) {
      await prisma.notifications.deleteMany({ where: { postId: { in: postIds } } });
      await prisma.like.deleteMany({ where: { postId: { in: postIds } } });
      await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
      await prisma.postTag.deleteMany({ where: { postId: { in: postIds } } });
      const del = await prisma.post.deleteMany({ where: { id: { in: postIds } } });
      console.log(`   ✅ Deleted ${del.count} seeded Post records from PostgreSQL.`);
    } else {
      console.log('   ℹ No tracked post IDs in session. Clearing session cache.');
    }
  } catch (err) {
    console.warn(`   ⚠️ Direct DB deletion skipped/failed (${err.message}).`);
  }

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.posts;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.posts;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared post session references.');
  await prisma.$disconnect();
}

resetFlow02();
