/**
 * FLOW 04 — Engagement Seeding Bot
 * ============================================================
 * Exercises public HTTP/API endpoints:
 * 1. Authenticate seed users via /api/auth/login
 * 2. Seed Likes via POST /api/posts/[id]/like
 * 3. Seed Comments via POST /api/posts/[id]/comments
 * 4. Record Re-Grid status (BLOCKED — REQUIRED API NOT IMPLEMENTED)
 *
 * Usage:
 *   node seeding_scripts/04_engagement_flow/bot.js
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
    throw new Error(`FLOW 04 ERROR: Master data_input.json not found at ${INPUT_PATH}`);
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
  throw new Error('FLOW 04 FAILED: Prerequisite session_state.json missing. Run Flows 01 & 02 first.');
}

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function runEngagementFlow() {
  console.log('🚀 FLOW 04: Engagement Seeding starting...\n');

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
      throw new Error(`FLOW 04 FAILED: Missing prerequisite user session for ${u.id}. Please execute Flow 01 first.`);
    }
  }

  if (!sessionData.posts || Object.keys(sessionData.posts).length === 0) {
    throw new Error('FLOW 04 FAILED: Missing prerequisite seeded posts in session_state.json. Please execute Flow 02 first.');
  }

  // 2. Authenticate Users via HTTP API
  const userClients = {};
  for (const u of seedUsers) {
    const client = new HttpClient(bffUrl);
    console.log(`[FLOW 04] Authenticating user ${u.email}...`);
    const loginRes = await client.post('/auth/login', {
      email: u.email,
      password: u.password,
    });

    if (!loginRes.ok || !loginRes.data?.success) {
      throw new Error(`FLOW 04 FAILED: HTTP Login failed for ${u.email}: ${JSON.stringify(loginRes.data || loginRes.rawBody)}`);
    }

    userClients[u.id] = client;
    console.log(`   ✓ Authenticated ${u.profile.username} via HTTP API`);
  }

  const engagementConfig = inputData.engagement || { likes: [], comments: [] };
  sessionData.engagement = { likes: [], comments: [] };

  // 3. Seed Likes
  console.log('\n[FLOW 04] Seeding Post Likes...');
  for (const likeSpec of engagementConfig.likes || []) {
    const userClient = userClients[likeSpec.userRef];
    const postSession = sessionData.posts[likeSpec.postRef];
    const userSession = sessionData[likeSpec.userRef];

    if (!userClient || !postSession) {
      throw new Error(`FLOW 04 FAILED: Invalid reference for like: user=${likeSpec.userRef}, post=${likeSpec.postRef}`);
    }

    console.log(`   ❤️ User ${userSession.username} liking post ${postSession.id.substring(0, 8)}...`);
    const likeRes = await userClient.post(`/posts/${postSession.id}/like`);

    if (!likeRes.ok || !likeRes.data?.success) {
      console.warn(`   ⚠️ Like response notice:`, likeRes.data || likeRes.rawBody);
    } else {
      console.log(`   ✓ Like registered successfully`);
    }

    sessionData.engagement.likes.push({
      userRef: likeSpec.userRef,
      userId: userSession.userId,
      postRef: likeSpec.postRef,
      postId: postSession.id,
    });

    await sleep(env.THROTTLE_MS || 300);
  }

  // 4. Seed Comments
  console.log('\n[FLOW 04] Seeding Post Comments...');
  for (const commentSpec of engagementConfig.comments || []) {
    const userClient = userClients[commentSpec.userRef];
    const postSession = sessionData.posts[commentSpec.postRef];
    const userSession = sessionData[commentSpec.userRef];

    if (!userClient || !postSession) {
      throw new Error(`FLOW 04 FAILED: Invalid reference for comment: user=${commentSpec.userRef}, post=${commentSpec.postRef}`);
    }

    console.log(`   💬 User ${userSession.username} commenting on post ${postSession.id.substring(0, 8)}...`);
    const commentRes = await userClient.post(`/posts/${postSession.id}/comments`, {
      content: commentSpec.content,
    });

    if (!commentRes.ok || !commentRes.data?.success) {
      throw new Error(`FLOW 04 FAILED: Comment creation failed for ${userSession.username}: ${JSON.stringify(commentRes.data || commentRes.rawBody)}`);
    }

    const createdComment = commentRes.data.comment;
    console.log(`   ✓ Comment created successfully (ID: ${createdComment?.id || 'OK'})`);

    sessionData.engagement.comments.push({
      userRef: commentSpec.userRef,
      userId: userSession.userId,
      postRef: commentSpec.postRef,
      postId: postSession.id,
      content: commentSpec.content,
      commentId: createdComment?.id || null,
    });

    await sleep(env.THROTTLE_MS || 300);
  }

  // 5. Seed Re-Grids (Post Amplification)
  console.log('\n[FLOW 04] Seeding Re-Grids (Post Amplification)...');
  sessionData.engagement.regrids = [];
  const regridSpecs = [
    { userRef: 'creator_02', postRef: 'post_01' },
    { userRef: 'tester_03', postRef: 'post_01' },
  ];

  for (const regridSpec of regridSpecs) {
    const userClient = userClients[regridSpec.userRef];
    const postSession = sessionData.posts[regridSpec.postRef];
    const userSession = sessionData[regridSpec.userRef];

    if (userClient && postSession) {
      console.log(`   🔄 User ${userSession.username} Re-Gridding post ${postSession.id.substring(0, 8)}...`);
      const regridRes = await userClient.post(`/posts/${postSession.id}/regrid`);

      if (!regridRes.ok || !regridRes.data?.success) {
        console.warn(`   ⚠️ Re-Grid response notice:`, regridRes.data || regridRes.rawBody);
      } else {
        console.log(`   ✓ Re-Grid created successfully`);
        sessionData.engagement.regrids.push({
          userRef: regridSpec.userRef,
          userId: userSession.userId,
          postRef: regridSpec.postRef,
          postId: postSession.id,
        });
      }
      await sleep(env.THROTTLE_MS || 300);
    }
  }

  saveSession(sessionData);
  console.log('\n🎉 FLOW 04: Engagement Seeding complete!\n');
}

runEngagementFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 04 Failed:', err.message);
    process.exit(1);
  });
