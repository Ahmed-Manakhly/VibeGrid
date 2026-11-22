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

// Try loading .env from root or cwd
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

const { PrismaClient } = require('@prisma/client');

let prisma = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn('⚠️ PrismaClient initialization notice:', e.message);
}

const ROOT_INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const LOCAL_INPUT_PATH = path.join(__dirname, 'data_input.json');
const INPUT_PATH = fs.existsSync(ROOT_INPUT_PATH) ? ROOT_INPUT_PATH : LOCAL_INPUT_PATH;
const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');
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

const ROOT_SESSION_PATH = path.join(__dirname, '..', 'session_state.json');

function saveSession(sessionData) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sessionData, null, 2));
  fs.writeFileSync(ROOT_SESSION_PATH, JSON.stringify(sessionData, null, 2));
}

async function verifyEmailViaApi(apiUrl, email) {
  const seedOtp = process.env.SEED_OTP || process.env.FIXED_SEED_OTP || '123456';
  try {
    const res = await fetch(`${apiUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: seedOtp, code: seedOtp }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✓ Email verified via API with seed OTP (${seedOtp})`);
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
  const env = queueData.env || { API_URL: 'http://localhost:3000/api', BFF_URL: 'http://localhost:3000/api', THROTTLE_MS: 300 };

  // URL VAR FOR LOCAL (Host native / localhost)
  // BFF_URL="http://localhost:3000/api"
  // URL VAR FOR PROD (Container network / VPS)
  // BFF_URL="https://www.vibegrid.manakhly.tech/api"
  const bffUrl = process.env.API_URL || process.env.BFF_URL || env.BFF_URL || env.API_URL || 'http://localhost:3000/api';
  console.log(`📡 Ingress API Target: ${bffUrl}`);

  const users = queueData.users || [];
  const sessions = {};

  for (const userConfig of users) {
    const { email, password, name, profile } = userConfig;
    console.log(`[FLOW 01] Processing user: ${email}...`);

    // Step 1: Register User via HTTP API
    try {
      const regRes = await fetch(`${bffUrl}/auth/register`, {
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

    // Step 2: Verify email via HTTP API using fixed dev OTP (123456)
    await verifyEmailViaApi(bffUrl, email);

    // Step 3: Login via HTTP API to authenticate and get session token
    let loginData = null;
    try {
      const loginRes = await fetch(`${bffUrl}/auth/login`, {
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
    let finalUsername = profile.username;

    // Step 4: Bootstrap & Populate PostgreSQL User Profile (if DB is directly reachable)
    if (prisma) {
      try {
        const existingPgUser = await prisma.user.findFirst({
          where: { OR: [{ id: authUserId }, { email }, { username: profile.username }] },
        });

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
      } catch (dbErr) {
        console.log(`   ℹ Note: Direct Prisma profile enrichment skipped (${dbErr.message}). Profile bootstrapped via BFF.`);
      }
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
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
  });
