/**
 * FLOW 04 — Reset Script (Local & Containerized Execution)
 * ============================================================
 * Local Execution: Directly connects to PostgreSQL via Prisma.
 * Remote VPS Execution: Use remote_reset.sh to execute inside vibegrid_bff container via SSH.
 *
 * Removes seeded likes, comments, and poll votes where user or author email matches seed users.
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

async function resetFlow04() {
  console.log('🔄 Resetting Flow 04 (Engagement)...');

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

    const userWhere = {
      OR: [
        ...(seedEmails.length > 0 ? [{ user: { email: { in: seedEmails } } }] : []),
        ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
      ],
    };

    const authorWhere = {
      OR: [
        ...(seedEmails.length > 0 ? [{ author: { email: { in: seedEmails } } }] : []),
        ...(userIds.length > 0 ? [{ authorId: { in: userIds } }] : []),
      ],
    };

    if (userWhere.OR.length > 0 || authorWhere.OR.length > 0) {
      const delVotes = await prisma.pollVote.deleteMany({ where: userWhere });
      const delCommentLikes = await prisma.commentLike.deleteMany({ where: userWhere });
      const delLikes = await prisma.like.deleteMany({ where: userWhere });
      const delComments = await prisma.comment.deleteMany({ where: authorWhere });
      console.log(`   ✅ Deleted engagement from PostgreSQL: ${delLikes.count} like(s), ${delCommentLikes.count} comment like(s), ${delComments.count} comment(s), ${delVotes.count} vote(s).`);
    } else {
      console.log('   ℹ No seed users or emails identified for engagement reset.');
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
      delete session.engagement;
      fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }
  if (fs.existsSync(FLOW_SESSION_PATH)) {
    try {
      const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
      delete session.engagement;
      fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
    } catch (e) {}
  }

  // Replenish engagement slice in data_input.json if local files exist
  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && refData.engagement) {
    try {
      const inp = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inp.engagement = refData.engagement;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inp, null, 2));
      console.log('   📋 Replenished engagement in data_input.json from reference data.');
    } catch (e) {}
  }

  console.log('✅ Flow 04 Reset complete.\n');
  await prisma.$disconnect();
}

resetFlow04().catch((e) => {
  console.error('❌ FLOW 04 Reset failed:', e.message);
  process.exit(1);
});
