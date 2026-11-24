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
const config = require('../shared/config');
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
  const bffUrl = config.apiUrl || process.env.API_URL || process.env.BFF_URL || env.BFF_URL || env.API_URL || 'http://localhost:3000/api';
  console.log(`📡 Ingress API Target: ${bffUrl}`);

  // 1. Validate Prerequisite State
  const seedUsers = config.getSeedUsers ? config.getSeedUsers(inputData) : (inputData.users || []);
  if (seedUsers.length === 0) {
    throw new Error('FLOW 04 FAILED: No seed users found in data_input.json or data_reference.json.');
  }

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
    console.log(`   ✓ Authenticated ${u.profile?.username || u.name} via HTTP API`);
  }

  const engagementConfig = inputData.engagement || { likes: [], comments: [] };
  const hasEngagement = (engagementConfig.likes?.length || 0) +
    (engagementConfig.comments?.length || 0) +
    (engagementConfig.pollVotes?.length || 0) +
    (engagementConfig.acceptedSolutions?.length || 0) +
    (engagementConfig.regrids?.length || 0);

  if (hasEngagement === 0) {
    console.log('✨ All engagement interactions are already seeded! (data_input.json queue empty)');
    return;
  }
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

  // 4. Seed Comments (including threaded replies)
  console.log('\n[FLOW 04] Seeding Post Comments & Threaded Discussions...');
  for (const commentSpec of engagementConfig.comments || []) {
    const userClient = userClients[commentSpec.userRef];
    const postSession = sessionData.posts[commentSpec.postRef];
    const userSession = sessionData[commentSpec.userRef];

    if (!userClient || !postSession) {
      throw new Error(`FLOW 04 FAILED: Invalid reference for comment: user=${commentSpec.userRef}, post=${commentSpec.postRef}`);
    }

    // Resolve parent comment ID for threaded replies
    let parentId = undefined;
    if (commentSpec.parentCommentRef) {
      const parentComment = sessionData.engagement.comments.find(
        (c) => c.commentRef === commentSpec.parentCommentRef || c.id === commentSpec.parentCommentRef
      );
      if (parentComment && parentComment.commentId) {
        parentId = parentComment.commentId;
        console.log(`   ↳ Replying to comment ${parentComment.commentId.substring(0, 8)}...`);
      }
    }

    console.log(`   💬 User ${userSession.username} commenting on post ${postSession.id.substring(0, 8)}...`);
    const commentRes = await userClient.post(`/posts/${postSession.id}/comments`, {
      content: commentSpec.content,
      parentId,
    });

    if (!commentRes.ok || !commentRes.data?.success) {
      throw new Error(`FLOW 04 FAILED: Comment creation failed for ${userSession.username}: ${JSON.stringify(commentRes.data || commentRes.rawBody)}`);
    }

    const createdComment = commentRes.data.comment;
    console.log(`   ✓ Comment created successfully (ID: ${createdComment?.id || 'OK'})`);

    sessionData.engagement.comments.push({
      commentRef: commentSpec.id || commentSpec.commentRef || `comment_${sessionData.engagement.comments.length + 1}`,
      userRef: commentSpec.userRef,
      userId: userSession.userId,
      postRef: commentSpec.postRef,
      postId: postSession.id,
      content: commentSpec.content,
      commentId: createdComment?.id || null,
      parentId: parentId || null,
    });

    await sleep(env.THROTTLE_MS || 300);
  }

  // 5. Seed Poll Votes on Tech Dilemmas
  sessionData.engagement.pollVotes = [];
  if (Array.isArray(engagementConfig.pollVotes) && engagementConfig.pollVotes.length > 0) {
    console.log('\n[FLOW 04] Seeding Poll Votes on Tech Dilemmas...');
    for (const voteSpec of engagementConfig.pollVotes) {
      const userClient = userClients[voteSpec.userRef];
      const postSession = sessionData.posts[voteSpec.postRef];
      const userSession = sessionData[voteSpec.userRef];

      if (userClient && postSession) {
        console.log(`   🗳️ User ${userSession.username} voting option index [${voteSpec.optionIndex}] on post ${postSession.id.substring(0, 8)}...`);
        const voteRes = await userClient.post(`/posts/${postSession.id}/poll/vote`, {
          optionIndex: voteSpec.optionIndex,
        });

        if (!voteRes.ok) {
          console.warn(`   ⚠️ Poll vote notice:`, voteRes.data || voteRes.rawBody);
        } else {
          console.log(`   ✓ Vote recorded successfully`);
          sessionData.engagement.pollVotes.push({
            userRef: voteSpec.userRef,
            postRef: voteSpec.postRef,
            optionIndex: voteSpec.optionIndex,
          });
        }
        await sleep(env.THROTTLE_MS || 300);
      }
    }
  }

  // 6. Seed Accepted Solutions on Technical Q&A
  sessionData.engagement.acceptedSolutions = [];
  if (Array.isArray(engagementConfig.acceptedSolutions) && engagementConfig.acceptedSolutions.length > 0) {
    console.log('\n[FLOW 04] Seeding Accepted Solutions on Technical Q&A...');
    for (const solSpec of engagementConfig.acceptedSolutions) {
      const authorClient = userClients[solSpec.authorRef || solSpec.userRef];
      const postSession = sessionData.posts[solSpec.postRef];
      const targetComment = sessionData.engagement.comments.find(
        (c) => c.commentRef === solSpec.commentRef || c.commentId === solSpec.commentRef
      );

      if (authorClient && postSession && targetComment?.commentId) {
        console.log(`   ✅ Question author marking comment ${targetComment.commentId.substring(0, 8)} as accepted solution...`);
        const solRes = await authorClient.post(`/posts/${postSession.id}/solution`, {
          commentId: targetComment.commentId,
        });

        if (!solRes.ok) {
          console.warn(`   ⚠️ Accept solution notice:`, solRes.data || solRes.rawBody);
        } else {
          console.log(`   ✓ Accepted solution marked successfully`);
          sessionData.engagement.acceptedSolutions.push({
            postRef: solSpec.postRef,
            commentRef: solSpec.commentRef,
            commentId: targetComment.commentId,
          });
        }
        await sleep(env.THROTTLE_MS || 300);
      }
    }
  }

  // 7. Seed Re-Grids (Post Amplification)
  console.log('\n[FLOW 04] Seeding Re-Grids (Post Amplification)...');
  sessionData.engagement.regrids = [];
  const regridSpecs = engagementConfig.regrids || [
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

  // Pop engagement items from consumable queue
  if (inputData.engagement) {
    inputData.engagement = {
      likes: [],
      comments: [],
      pollVotes: [],
      acceptedSolutions: [],
      regrids: [],
    };
    fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
  }

  saveSession(sessionData);
  console.log('\n🎉 FLOW 04: Engagement Seeding complete!\n');
}

runEngagementFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 04 Failed:', err.message);
    process.exit(1);
  });
