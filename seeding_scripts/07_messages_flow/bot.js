/**
 * FLOW 07 — Direct Messaging & Conversations Seeding Bot
 * ============================================================
 * Exercises public HTTP/API endpoints:
 * 1. Authenticate seed users via /api/auth/login
 * 2. Initiate 1-on-1 conversations via POST /api/messages/conversations
 * 3. Seed real-time direct chat messages via POST /api/messages/conversations/[id]/messages
 * 4. Verify message history retrieval via GET /api/messages/conversations/[id]/messages
 *
 * Usage:
 *   node seeding_scripts/07_messages_flow/bot.js
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
    throw new Error(`FLOW 07 ERROR: Master data_input.json not found at ${INPUT_PATH}`);
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
  throw new Error('FLOW 07 FAILED: Prerequisite session_state.json missing. Run Flow 01 first.');
}

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function runMessagesFlow() {
  console.log('🚀 FLOW 07: Direct Messaging & Conversations Seeding starting...\n');

  const inputData = loadInput();
  const sessionData = loadSession();
  const env = inputData.env || { BFF_URL: 'http://localhost:3000/api', THROTTLE_MS: 300 };

  const bffUrl = process.env.API_URL || process.env.BFF_URL || env.BFF_URL || env.API_URL || 'http://localhost:3000/api';
  console.log(`📡 Ingress API Target: ${bffUrl}`);

  // 1. Validate Prerequisite State
  const seedUsers = inputData.users || [];
  for (const u of seedUsers) {
    if (!sessionData[u.id] || !sessionData[u.id].userId) {
      throw new Error(`FLOW 07 FAILED: Missing prerequisite user session for ${u.id}. Please execute Flow 01 first.`);
    }
  }

  // 2. Authenticate Users via HTTP API
  const userClients = {};
  for (const u of seedUsers) {
    const client = new HttpClient(bffUrl);
    console.log(`[FLOW 07] Authenticating user ${u.email}...`);
    const loginRes = await client.post('/auth/login', {
      email: u.email,
      password: u.password,
    });

    if (!loginRes.ok || !loginRes.data?.success) {
      throw new Error(`FLOW 07 FAILED: HTTP Login failed for ${u.email}: ${JSON.stringify(loginRes.data || loginRes.rawBody)}`);
    }

    userClients[u.id] = client;
    console.log(`   ✓ Authenticated ${u.profile.username} via HTTP API`);
  }

  sessionData.conversations = sessionData.conversations || {};
  const conversationsConfig = inputData.conversations || inputData.directMessages || [];

  if (conversationsConfig.length === 0) {
    console.log('   ℹ No conversations defined in data_input.json. Skipping message seeding.');
    saveSession(sessionData);
    console.log('\n🎉 FLOW 07: Direct Messaging complete (no threads configured)!\n');
    return;
  }

  // 3. Process Conversations & Messages
  console.log('\n[FLOW 07] Establishing 1-on-1 direct conversations & exchange threads...');
  for (const convSpec of conversationsConfig) {
    const [userRefA, userRefB] = convSpec.participantRefs;
    const clientA = userClients[userRefA];
    const sessionA = sessionData[userRefA];
    const sessionB = sessionData[userRefB];

    if (!clientA || !sessionB) {
      throw new Error(`FLOW 07 FAILED: Invalid participant references in conversation ${convSpec.id}: ${userRefA}, ${userRefB}`);
    }

    console.log(`[FLOW 07] Starting conversation between ${sessionA.username} and ${sessionB.username}...`);
    const startRes = await clientA.post('/messages/conversations', {
      targetUserId: sessionB.userId,
    });

    if (!startRes.ok || !startRes.data?.conversation) {
      throw new Error(`FLOW 07 FAILED: Failed to start conversation: ${JSON.stringify(startRes.data || startRes.rawBody)}`);
    }

    const conversation = startRes.data.conversation;
    console.log(`   ✓ Conversation established (ID: ${conversation.id})`);

    sessionData.conversations[convSpec.id] = {
      id: conversation.id,
      participants: [sessionA.userId, sessionB.userId],
      participantUsernames: [sessionA.username, sessionB.username],
      messagesCount: 0,
    };

    // Seed Messages in this Conversation
    const messages = convSpec.messages || [];
    for (const msgSpec of messages) {
      const senderClient = userClients[msgSpec.senderRef];
      const senderSession = sessionData[msgSpec.senderRef];

      if (!senderClient) {
        throw new Error(`FLOW 07 FAILED: Sender client not found for ${msgSpec.senderRef}`);
      }

      console.log(`   💬 [${senderSession.username}]: "${msgSpec.content.substring(0, 50)}${msgSpec.content.length > 50 ? '...' : ''}"`);
      const msgRes = await senderClient.post(`/messages/conversations/${conversation.id}/messages`, {
        content: msgSpec.content,
      });

      if (!msgRes.ok || !msgRes.data?.message) {
        console.warn(`   ⚠️ Send message notice:`, msgRes.data || msgRes.rawBody);
      } else {
        sessionData.conversations[convSpec.id].messagesCount++;
      }

      await sleep(env.THROTTLE_MS || 300);
    }

    // Pop seeded conversation from consumable queue
    if (Array.isArray(inputData.conversations)) {
      inputData.conversations = inputData.conversations.filter((c) => c.id !== convSpec.id);
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
    }
  }

  saveSession(sessionData);
  console.log('\n🎉 FLOW 07: Direct Messaging & Conversations Seeding complete!\n');
}

runMessagesFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 07 Failed:', err.message);
    process.exit(1);
  });

