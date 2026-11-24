/**
 * FLOW 02 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded posts, attachments, comments, likes, tags, poll options, bookmarks,
 * and clears session_state.json.
 * Dynamic fallback extracts posts from session state OR queries posts by seed author emails.
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

async function resetFlow02() {
  console.log('🔄 Resetting Flow 02 (Posts & Media)...');

  try {
    const refData = loadReferenceData();
    const sessionData = loadSessionData();
    const seedEmails = Array.isArray(refData.users) ? refData.users.map((u) => u.email).filter(Boolean) : [];

    let postIds = [];
    if (sessionData && sessionData.posts) {
      postIds = Object.values(sessionData.posts).map((p) => p.id).filter(Boolean);
    }

    // Lookup posts whose author email is in seed user emails
    if (seedEmails.length > 0) {
      try {
        const authorPosts = await prisma.post.findMany({
          where: {
            author: {
              email: { in: seedEmails },
            },
          },
          select: { id: true },
        });
        for (const ap of authorPosts) {
          if (ap.id && !postIds.includes(ap.id)) {
            postIds.push(ap.id);
          }
        }
      } catch (err) {
        console.warn(`   ⚠️ Could not query posts by author email: ${err.message}`);
      }
    }

    if (postIds.length > 0) {
      // Clean dependent relations prior to post deletion
      await prisma.notifications.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.like.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.bookmark.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.commentLike.deleteMany({ where: { comment: { postId: { in: postIds } } } }).catch(() => {});
      await prisma.comment.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.postTag.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.pollVote.deleteMany({ where: { poll: { postId: { in: postIds } } } }).catch(() => {});
      await prisma.pollOption.deleteMany({ where: { poll: { postId: { in: postIds } } } }).catch(() => {});
      await prisma.poll.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});
      await prisma.reGrid.deleteMany({ where: { postId: { in: postIds } } }).catch(() => {});

      // Clear quote references if any
      await prisma.post.updateMany({
        where: { quotedPostId: { in: postIds } },
        data: { quotedPostId: null },
      }).catch(() => {});

      const del = await prisma.post.deleteMany({ where: { id: { in: postIds } } });
      console.log(`   ✅ Deleted ${del.count} seeded Post records from PostgreSQL.`);
    } else {
      console.log('   ℹ No tracked or author-matched seed post IDs found.');
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
      delete session.posts;
      fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }
  if (fs.existsSync(FLOW_SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
      delete session.posts;
      fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }

  // Replenish posts slice in data_input.json if local files exist
  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && Array.isArray(refData.posts)) {
    try {
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inp.posts = refData.posts;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
      console.log('   📋 Replenished posts in data_input.json from reference data.');
    } catch (e) {}
  }

  console.log('✅ Flow 02 Reset complete.\n');
  await prisma.$disconnect();
}

resetFlow02().catch((e) => {
  console.error('❌ FLOW 02 Reset failed:', e.message);
  process.exit(1);
});
