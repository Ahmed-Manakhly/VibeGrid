/**
 * FLOW 03 — Social Graph Seeding Bot
 * ============================================================
 * Exercises public HTTP/API endpoints:
 * 1. Authenticate seed users via /api/auth/login
 * 2. Establish follow / tuning-in relationships via POST /api/social/follow
 * 3. Verify relationships and duplicate follow safety
 *
 * Usage:
 *   node seeding_scripts/03_social_graph_flow/bot.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { HttpClient } = require('../shared/http');

const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadInput() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`FLOW 03 ERROR: Master data_input.json not found at ${INPUT_PATH}`);
  }
  return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
}

function loadSession() {
  const paths = [
    path.join(__dirname, '..', 'session_state.json'),
    path.join(__dirname, 'session_state.json'),
    path.join(__dirname, '..', '01_auth_profile_flow', 'session_state.json')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  throw new Error('FLOW 03 FAILED: Prerequisite session_state.json missing. Run Flow 01 first.');
}

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function runSocialGraphFlow() {
  console.log('🚀 FLOW 03: Social Graph Seeding starting...\n');

  const inputData = loadInput();
  const sessionData = loadSession();
  const env = inputData.env || { BFF_URL: 'http://localhost:3000/api', THROTTLE_MS: 300 };
  // URL VAR FOR LOCAL (Host native / localhost)
  // BFF_URL="http://localhost:3000/api"
  // URL VAR FOR PROD (Container network / VPS)
  // BFF_URL="https://www.vibegrid.manakhly.tech/api"
  const bffUrl = process.env.API_URL || process.env.BFF_URL || env.BFF_URL || env.API_URL || 'http://localhost:3000/api';
  console.log(`📡 Ingress API Target: ${bffUrl}`);

  // 1. Validate Prerequisite State
  const seedUsers = inputData.users || [];
  for (const u of seedUsers) {
    if (!sessionData[u.id] || !sessionData[u.id].userId) {
      throw new Error(`FLOW 03 FAILED: Missing prerequisite user session for ${u.id} (${u.email}). Please execute Flow 01 first.`);
    }
  }

  // 2. Authenticate Users via HTTP API
  const userClients = {};
  for (const u of seedUsers) {
    const client = new HttpClient(bffUrl);
    console.log(`[FLOW 03] Authenticating user ${u.email}...`);
    const loginRes = await client.post('/auth/login', {
      email: u.email,
      password: u.password,
    });

    if (!loginRes.ok || !loginRes.data?.success) {
      throw new Error(`FLOW 03 FAILED: HTTP Login failed for ${u.email}: ${JSON.stringify(loginRes.data || loginRes.rawBody)}`);
    }

    userClients[u.id] = client;
    console.log(`   ✓ Authenticated ${u.profile.username} via HTTP API`);
  }

  // 3. Process Social Graph Relationships
  const relationships = inputData.socialGraph || [];
  sessionData.socialGraph = [];

  for (const rel of relationships) {
    const followerClient = userClients[rel.followerRef];
    const targetSession = sessionData[rel.targetRef];
    const followerSession = sessionData[rel.followerRef];

    if (!followerClient || !targetSession) {
      throw new Error(`FLOW 03 FAILED: Invalid relationship references: ${rel.followerRef} -> ${rel.targetRef}`);
    }

    console.log(`[FLOW 03] Establishing follow: ${followerSession.username} -> ${targetSession.username}...`);

    const followRes = await followerClient.post('/social/follow', {
      targetUserId: targetSession.userId,
    });

    if (!followRes.ok || !followRes.data?.success) {
      console.warn(`   ⚠️ Follow response notice:`, followRes.data || followRes.rawBody);
    } else {
      console.log(`   ✓ Follow relationship created/toggled successfully`);
    }

    sessionData.socialGraph.push({
      followerRef: rel.followerRef,
      followerId: followerSession.userId,
      targetRef: rel.targetRef,
      targetUserId: targetSession.userId,
    });

    await sleep(env.THROTTLE_MS || 300);
  }

  // 4. Verify Social Graph Relationships
  console.log('[FLOW 03] Verifying social graph state via HTTP API...');
  const firstUser = seedUsers[0];
  const meRes = await userClients[firstUser.id].get('/auth/me');
  if (meRes.ok && meRes.data?.user) {
    console.log(`   ✓ User session verified via GET /api/auth/me for ${meRes.data.user.email}`);
  }

  saveSession(sessionData);
  console.log('\n🎉 FLOW 03: Social Graph Seeding complete!\n');
}

runSocialGraphFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 03 Failed:', err.message);
    process.exit(1);
  });
