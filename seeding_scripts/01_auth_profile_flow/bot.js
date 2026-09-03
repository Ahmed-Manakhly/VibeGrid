/**
 * FLOW 01 — Auth & Profile Bot
 * ============================================================
 * Exercises public HTTP/API endpoints:
 * 1. Register User via Auth Gateway API (/api/auth/register)
 * 2. Mark email verified in auth DB (dev auto-verify for seed users)
 * 3. Bootstrap PostgreSQL user profile via ProfileBootstrapService
 * 4. Update extended profile (bio, location, website) via Prisma
 *
 * Usage:
 *   node seeding_scripts/01_auth_profile_flow/bot.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');
const INPUT_PATH = path.join(__dirname, 'data_input.json');
const SESSION_PATH = path.join(__dirname, 'session_state.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadQueue() {
  if (!fs.existsSync(INPUT_PATH)) {
    const ref = fs.readFileSync(REFERENCE_PATH, 'utf8');
    fs.writeFileSync(INPUT_PATH, ref);
  }
  return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
}

function saveQueue(data) {
  fs.writeFileSync(INPUT_PATH, JSON.stringify(data, null, 2));
}

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function verifyEmailViaApi(apiUrl, email) {
  try {
    const res = await fetch(`${apiUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '123456', code: '123456' }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✓ Email verified via API with fixed OTP`);
    } else {
      console.warn(`   ⚠️ Email verification response:`, data);
    }
  } catch (err) {
    console.warn(`[FLOW 01 Warning] Failed to verify email for ${email} via API:`, err.message);
  }
}

async function runAuthProfileFlow() {
  console.log('🚀 FLOW 01: Auth & Profile Seeding starting...\n');

  const queueData = loadQueue();
  const env = queueData.env || { API_URL: 'http://localhost:8000/api', THROTTLE_MS: 300 };
  const users = queueData.users || [];

  const sessions = {};

  for (const userConfig of users) {
    const { email, password, name, profile } = userConfig;
    console.log(`[FLOW 01] Processing user: ${email}...`);

    // Step 1: Register User via HTTP API
    try {
      const regRes = await fetch(`${env.API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          passwordConfirm: password,
          name,
        }),
      });

      const regJson = await regRes.json();
      if (regRes.ok || regJson.message?.includes('already registered')) {
        console.log(`   ✓ Registration endpoint reached (${regRes.status})`);
      } else {
        console.error(`   ❌ Registration failed:`, regJson);
        throw new Error(`HTTP ${regRes.status}: ${JSON.stringify(regJson)}`);
      }
    } catch (err) {
      if (err.message?.includes('already registered')) {
        console.log(`   ℹ User ${email} already exists in Auth Service.`);
      } else {
        throw err;
      }
    }

    // Step 2: Verify email via HTTP API using fixed OTP (123456)
    await verifyEmailViaApi(env.API_URL, email);

    // Step 3: Login via HTTP API to authenticate and get session token
    let loginData = null;
    try {
      const loginRes = await fetch(`${env.API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginJson = await loginRes.json();
      if (!loginRes.ok || !loginJson.data) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(loginJson)}`);
      }

      loginData = loginJson.data;
      console.log(`   ✓ User authenticated successfully via HTTP API`);
    } catch (err) {
      console.error(`   ❌ Login error:`, err.message);
      throw err;
    }

    const authUserId = loginData.user.id;

    // Step 4: Bootstrap & Populate PostgreSQL User Profile
    const existingPgUser = await prisma.user.findFirst({
      where: { OR: [{ id: authUserId }, { email }, { username: profile.username }] },
    });

    let finalUsername = profile.username;

    if (existingPgUser) {
      // Update profile
      await prisma.user.update({
        where: { id: existingPgUser.id },
        data: {
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
        },
      });
      finalUsername = existingPgUser.username;
      console.log(`   ✓ Updated existing profile for ${profile.username}`);
    } else {
      // Create profile
      await prisma.user.create({
        data: {
          id: authUserId,
          email,
          name: profile.name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
        },
      });
      console.log(`   ✓ Created new profile for ${profile.username}`);
    }

    sessions[userConfig.id] = {
      userId: authUserId,
      email,
      username: finalUsername,
      name: profile.name,
      accessToken: loginData.tokens?.accessToken || loginData.accessToken,
    };

    await sleep(env.THROTTLE_MS || 300);
  }

  saveSession(sessions);
  console.log('\n🎉 FLOW 01: Auth & Profile Seeding complete!\n');
}

runAuthProfileFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 01 Failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
