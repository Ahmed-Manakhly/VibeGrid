/**
 * FLOW 02 — Posts & Media Seeding Bot
 * ============================================================
 * Exercises public HTTP/API endpoints:
 * 1. Authenticate users via /api/auth/login
 * 2. Upload media via Media Service (/api/media/upload-intent -> upload -> /api/media/confirm-upload)
 * 3. Create posts via /api/posts
 * 4. Verify post retrieval via GET /api/posts
 *
 * Usage:
 *   node seeding_scripts/02_posts_media_flow/bot.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { HttpClient } = require('../shared/http');

const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample_test.png');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadInput() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`FLOW 02 ERROR: Master data_input.json not found at ${INPUT_PATH}`);
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
  throw new Error('FLOW 02 FAILED: Prerequisite session_state.json missing. Run Flow 01 first.');
}

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function runPostsMediaFlow() {
  console.log('🚀 FLOW 02: Posts & Media Seeding starting...\n');

  const inputData = loadInput();
  const sessionData = loadSession();
  const env = inputData.env || { BFF_URL: 'http://localhost:3000/api', THROTTLE_MS: 300 };
  const bffUrl = env.BFF_URL || 'http://localhost:3000/api';

  // 1. Validate Prerequisite State
  const seedUsers = inputData.users || [];
  for (const u of seedUsers) {
    if (!sessionData[u.id] || !sessionData[u.id].userId) {
      throw new Error(`FLOW 02 FAILED: Missing prerequisite user session for ${u.id} (${u.email}). Please execute Flow 01 first.`);
    }
  }

  // 2. Authenticate Users via HTTP API
  const userClients = {};
  for (const u of seedUsers) {
    const client = new HttpClient(bffUrl);
    console.log(`[FLOW 02] Authenticating user ${u.email}...`);
    const loginRes = await client.post('/auth/login', {
      email: u.email,
      password: u.password,
    });

    if (!loginRes.ok || !loginRes.data?.success) {
      throw new Error(`FLOW 02 FAILED: HTTP Login failed for ${u.email}: ${JSON.stringify(loginRes.data || loginRes.rawBody)}`);
    }

    userClients[u.id] = client;
    console.log(`   ✓ Authenticated ${u.profile.username} via HTTP API`);
  }

  // 3. Fetch Existing Posts for Idempotency Check
  const primaryClient = Object.values(userClients)[0];
  const feedRes = await primaryClient.get('/posts');
  const existingPosts = feedRes.ok && Array.isArray(feedRes.data?.vibes) ? feedRes.data.vibes : [];

  sessionData.posts = sessionData.posts || {};
  const seedPosts = inputData.posts || [];

  for (const pConfig of seedPosts) {
    console.log(`[FLOW 02] Processing post seed ${pConfig.id}...`);
    const authorClient = userClients[pConfig.authorRef];
    if (!authorClient) {
      throw new Error(`FLOW 02 FAILED: Author client not found for ref ${pConfig.authorRef}`);
    }

    const authorSession = sessionData[pConfig.authorRef];

    // Idempotency Check: Look for existing post matching content & author
    const existing = existingPosts.find(
      (ep) => ep.content === pConfig.content && (ep.authorId === authorSession.userId || ep.author?.username === authorSession.username)
    );

    if (existing) {
      console.log(`   ℹ Post already exists (ID: ${existing.id}). Reusing.`);
      sessionData.posts[pConfig.id] = {
        id: existing.id,
        authorRef: pConfig.authorRef,
        authorId: authorSession.userId,
        content: existing.content,
        imageUrl: existing.imageUrl || null,
        tags: existing.tags || pConfig.tags || [],
      };
      continue;
    }

    // Optional Media Upload
    let imageUrl = '';
    if (pConfig.mediaFixture && fs.existsSync(FIXTURE_PATH)) {
      console.log(`   📷 Uploading media fixture (${pConfig.mediaFixture})...`);
      const fileBuf = fs.readFileSync(FIXTURE_PATH);
      
      // Upload Intent
      const intentRes = await authorClient.post('/media/upload-intent', {
        mimeType: 'image/png',
        fileSizeBytes: fileBuf.length,
        purpose: 'post_media',
      });

      if (intentRes.ok && intentRes.data?.data) {
        const { assetId, uploadUrl } = intentRes.data.data;
        
        // Upload binary to presigned URL if provided
        if (uploadUrl) {
          try {
            await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'image/png' },
              body: fileBuf,
            });
          } catch (e) {
            console.warn(`   ⚠️ Presigned URL direct upload notice:`, e.message);
          }
        }

        // Confirm Upload
        const confirmRes = await authorClient.post('/media/confirm-upload', { assetId });
        if (confirmRes.ok && confirmRes.data?.data) {
          imageUrl = confirmRes.data.data.publicUrl || confirmRes.data.data.mediaUrl || '';
          console.log(`   ✓ Media uploaded & confirmed: ${imageUrl}`);
        } else {
          console.warn(`   ⚠️ Media confirm-upload response:`, confirmRes.data);
        }
      } else {
        console.warn(`   ⚠️ Media upload-intent response:`, intentRes.data);
      }
    }

    // Create Post via HTTP API
    const createRes = await authorClient.post('/posts', {
      content: pConfig.content,
      imageUrl: imageUrl || undefined,
      tags: pConfig.tags,
    });

    if (!createRes.ok || !createRes.data?.success) {
      throw new Error(`FLOW 02 FAILED: Post creation failed (HTTP ${createRes.status}): ${JSON.stringify(createRes.data || createRes.rawBody)}`);
    }

    const createdPost = createRes.data.post;
    console.log(`   ✓ Created post (ID: ${createdPost.id})`);

    sessionData.posts[pConfig.id] = {
      id: createdPost.id,
      authorRef: pConfig.authorRef,
      authorId: authorSession.userId,
      content: createdPost.content,
      imageUrl: createdPost.imageUrl || imageUrl || null,
      tags: createdPost.tags || pConfig.tags || [],
    };

    await sleep(env.THROTTLE_MS || 300);
  }

  // 4. Verify Post Retrieval
  console.log('[FLOW 02] Verifying post feed retrieval via HTTP API...');
  const verifyRes = await primaryClient.get('/posts');
  if (!verifyRes.ok) {
    throw new Error(`FLOW 02 FAILED: Unable to verify post feed retrieval (HTTP ${verifyRes.status})`);
  }
  const feedVibes = verifyRes.data?.vibes || [];
  console.log(`   ✓ Feed retrievable via HTTP API (${feedVibes.length} total posts)`);

  saveSession(sessionData);
  console.log('\n🎉 FLOW 02: Posts & Media Seeding complete!\n');
}

runPostsMediaFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 02 Failed:', err.message);
    process.exit(1);
  });
