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
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

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

  // 2.5 Resolve Taxonomy Maps (Categories & Vibes) via /feed/filters
  const primaryClient = Object.values(userClients)[0];
  const categoryMap = {};
  const vibeMap = {};
  try {
    const filtersRes = await primaryClient.get('/feed/filters');
    if (filtersRes.ok && filtersRes.data) {
      (filtersRes.data.categories || []).forEach((c) => {
        categoryMap[c.slug] = c.id;
        categoryMap[c.name.toLowerCase()] = c.id;
      });
      (filtersRes.data.vibes || []).forEach((v) => {
        vibeMap[v.key] = v.id;
        vibeMap[v.name.toLowerCase()] = v.id;
      });
      console.log(`   ✓ Loaded ${Object.keys(categoryMap).length / 2} categories and ${Object.keys(vibeMap).length / 2} vibes for post attribution.`);
    }
  } catch (e) {
    console.warn('   ⚠️ Could not fetch feed filters for taxonomy mapping:', e.message);
  }

  // 3. Fetch Existing Posts for Idempotency Check
  const feedRes = await primaryClient.get('/posts');
  const existingPosts = feedRes.ok && Array.isArray(feedRes.data?.vibes) ? feedRes.data.vibes : [];

  sessionData.posts = sessionData.posts || {};
  const seedPosts = inputData.posts || [];
  if (seedPosts.length === 0) {
    console.log('✨ All posts are already seeded! (data_input.json queue empty)');
    return;
  }

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
      // Pop existing post from consumable queue
      inputData.posts = inputData.posts.filter((p) => p.id !== pConfig.id);
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      continue;
    }

    // Optional Real Media Upload
    let imageUrl = '';
    const fixtureFileName = pConfig.mediaFixture || 'tech_feed_01.jpg';
    const fixturePath = path.join(FIXTURES_DIR, fixtureFileName);

    if (pConfig.mediaFixture && fs.existsSync(fixturePath)) {
      console.log(`   📷 Uploading media fixture (${fixtureFileName})...`);
      const fileBuf = fs.readFileSync(fixturePath);
      const ext = path.extname(fixtureFileName).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');

      // Upload Intent
      const intentRes = await authorClient.post('/media/upload-intent', {
        mimeType,
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
              headers: { 'Content-Type': mimeType },
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

    // Resolve Community ID if communityRef specified
    const communityId = pConfig.communityRef
      ? (sessionData.communities?.[pConfig.communityRef]?.id || pConfig.communityId)
      : undefined;

    // Resolve Quoted Post ID if quotedPostRef specified
    const quotedPostId = pConfig.quotedPostRef
      ? (sessionData.posts?.[pConfig.quotedPostRef]?.id || pConfig.quotedPostId)
      : undefined;

    // Resolve Category ID
    const categoryId = pConfig.categoryRef
      ? (categoryMap[pConfig.categoryRef] || categoryMap[String(pConfig.categoryRef).toLowerCase()] || pConfig.categoryId)
      : pConfig.categoryId;

    // Resolve Vibe ID
    const vibeId = pConfig.vibeRef
      ? (vibeMap[pConfig.vibeRef] || vibeMap[String(pConfig.vibeRef).toLowerCase()] || pConfig.vibeId)
      : pConfig.vibeId;

    // Create Post via HTTP API
    let postType = pConfig.postType;
    if (postType === 'DEFAULT') postType = 'STANDARD';
    if (postType === 'POLL') postType = 'DILEMMA_POLL';
    if (!postType) {
      postType = pConfig.poll ? 'DILEMMA_POLL' : (pConfig.techContext ? 'QUESTION' : 'STANDARD');
    }
    const createRes = await authorClient.post('/posts', {
      content: pConfig.content || '',
      mediaUrl: imageUrl || undefined,
      mediaType: imageUrl ? 'IMAGE' : undefined,
      tags: pConfig.tags,
      postType,
      categoryId: categoryId || undefined,
      vibeId: vibeId || undefined,
      techContext: pConfig.techContext,
      poll: pConfig.poll,
      communityId,
      quotedPostId,
    });

    if (!createRes.ok || !createRes.data?.success) {
      throw new Error(`FLOW 02 FAILED: Post creation failed (HTTP ${createRes.status}): ${JSON.stringify(createRes.data || createRes.rawBody)}`);
    }

    const createdPost = createRes.data.post;
    console.log(`   ✓ Created ${postType || 'vibe'} post (ID: ${createdPost.id})`);

    sessionData.posts[pConfig.id] = {
      id: createdPost.id,
      authorRef: pConfig.authorRef,
      authorId: authorSession.userId,
      content: createdPost.content,
      postType: createdPost.postType || postType || 'DEFAULT',
      pollId: createdPost.poll?.id || null,
      pollOptions: createdPost.poll?.options || null,
      communityId: communityId || null,
      imageUrl: createdPost.imageUrl || imageUrl || null,
      tags: createdPost.tags || pConfig.tags || [],
    };

    // Pop seeded post from consumable queue
    inputData.posts = inputData.posts.filter((p) => p.id !== pConfig.id);
    fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));

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
