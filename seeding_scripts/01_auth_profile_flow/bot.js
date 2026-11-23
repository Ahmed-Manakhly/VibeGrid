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

const ROOT_INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const LOCAL_INPUT_PATH = path.join(__dirname, 'data_input.json');
const INPUT_PATH = fs.existsSync(ROOT_INPUT_PATH) ? ROOT_INPUT_PATH : LOCAL_INPUT_PATH;
const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');
const SESSION_PATH = path.join(__dirname, 'session_state.json');
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const { HttpClient } = require('../shared/http');

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

  // Pre-fetch available categories via Public HTTP (GET /api/feed/filters) for interest mapping
  let categoryMap = {};
  let validCategoryIds = new Set();
  const TOPIC_ALIASES = {
    cloud: 'devops',
    systems: 'system-design',
    system: 'system-design',
    ai: 'ai-ml',
    ml: 'ai-ml',
    databases: 'database',
    architecture: 'system-design',
    cleanarchitecture: 'system-design',
    rust: 'tech',
    performance: 'system-design',
    apis: 'backend',
    api: 'backend',
    react: 'frontend',
    nextjs: 'frontend',
    kubernetes: 'devops',
    realtime: 'tech',
    distributed: 'system-design',
    leadership: 'culture',
    management: 'business',
  };

  try {
    const filterRes = await fetch(`${bffUrl}/feed/filters`);
    if (filterRes.ok) {
      const filterData = await filterRes.json();
      const catList = filterData.categories || [];
      for (const cat of catList) {
        validCategoryIds.add(cat.id);
        categoryMap[cat.slug.toLowerCase()] = cat.id;
        categoryMap[cat.name.toLowerCase()] = cat.id;
        categoryMap[cat.id] = cat.id;
      }
    }
  } catch (fErr) {
    console.warn('⚠️ Notice: Could not pre-fetch feed filters for categories:', fErr.message);
  }

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
    const userClient = new HttpClient(bffUrl);
    try {
      const loginRes = await userClient.post('/auth/login', { email, password });
      const loginJson = loginRes.data || {};

      if (!loginRes.ok || (!loginJson.data && !loginJson.user && !loginJson.success)) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(loginJson || loginRes.rawBody)}`);
      }

      loginData = loginJson.data || loginJson;
      console.log(`   ✓ User authenticated successfully via HTTP API`);
    } catch (err) {
      console.error(`   ❌ Login error:`, err.message);
      throw err;
    }

    const authUserId = loginData.user?.id || loginData.id;
    let finalUsername = profile.username;

    // Step 3.5: Upload Avatar Fixture via Media Service if specified
    let avatarUrl = profile.image || '';
    if (profile.avatarFixture) {
      const fixturePath = path.join(FIXTURES_DIR, profile.avatarFixture);
      if (fs.existsSync(fixturePath)) {
        try {
          console.log(`   📷 Uploading avatar fixture (${profile.avatarFixture})...`);
          const fileBuf = fs.readFileSync(fixturePath);
          const ext = path.extname(profile.avatarFixture).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');

          const intentRes = await userClient.post('/media/upload-intent', {
            type: 'AVATAR',
            filename: profile.avatarFixture,
            mimeType,
            sizeBytes: fileBuf.length,
          });

          if (intentRes.ok && intentRes.data?.data) {
            const { assetId, uploadUrl } = intentRes.data.data;
            if (uploadUrl) {
              await fetch(uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': mimeType },
                body: fileBuf,
              });
            }

            const confirmRes = await userClient.post('/media/confirm-upload', { assetId });
            if (confirmRes.ok && confirmRes.data?.data) {
              avatarUrl = confirmRes.data.data.publicUrl || confirmRes.data.data.mediaUrl || '';
              console.log(`   ✓ Avatar uploaded & confirmed: ${avatarUrl}`);
            }
          }
        } catch (avErr) {
          console.warn(`   ⚠️ Avatar upload notice:`, avErr.message);
        }
      }
    }

    // Step 4: Enrich Profile via Public HTTP Ingress (PUT /api/profile)
    try {
      const profileUpdateRes = await userClient.put('/profile', {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        image: avatarUrl || undefined,
      });
      if (profileUpdateRes.ok) {
        console.log(`   ✓ Profile updated via HTTP for ${profile.username}`);
      } else {
        console.warn(`   ⚠️ Profile update returned status ${profileUpdateRes.status}`);
      }
    } catch (profErr) {
      console.warn(`   ⚠️ Profile update via HTTP notice:`, profErr.message);
    }

    sessions[userConfig.id] = {
      userId: authUserId,
      email,
      username: profile.username,
      name: profile.name,
      avatarUrl: avatarUrl || null,
      accessToken: loginData.tokens?.accessToken || loginData.accessToken,
    };

    // Step 5: Assign Category Interests via HTTP API if provided
    const interests = userConfig.interests || profile.interests || [];
    if (interests.length > 0 && validCategoryIds.size > 0) {
      try {
        const resolvedIds = interests
          .map((item) => {
            const raw = String(item).toLowerCase().trim();
            const alias = TOPIC_ALIASES[raw] || raw;
            const id = categoryMap[alias] || categoryMap[raw] || (validCategoryIds.has(item) ? item : null);
            return id;
          })
          .filter((id) => id && validCategoryIds.has(id));

        const uniqueCategoryIds = Array.from(new Set(resolvedIds));

        if (uniqueCategoryIds.length > 0) {
          const intRes = await userClient.put('/social/interests', {
            categoryIds: uniqueCategoryIds,
          });
          if (intRes.ok) {
            console.log(`   ✓ Assigned ${uniqueCategoryIds.length} topic interest(s) for ${profile.username}`);
          } else {
            console.warn(`   ⚠️ Interest update notice (${intRes.status}):`, intRes.data);
          }
        }
      } catch (intErr) {
        console.warn(`   ⚠️ Interest assignment notice:`, intErr.message);
      }
    }

    await sleep(env.THROTTLE_MS || 300);
  }

  saveSession(sessions);
  console.log('\n🎉 FLOW 01: Auth & Profile Seeding complete!\n');
}

runAuthProfileFlow()
  .catch((err) => {
    console.error('\n❌ FLOW 01 Failed:', err.message);
    process.exit(1);
  });
