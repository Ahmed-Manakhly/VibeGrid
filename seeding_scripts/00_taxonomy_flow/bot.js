/**
 * FLOW 00 — Taxonomy & Categories Bot (Pure Standalone HTTP Ingress)
 * ============================================================
 * - Simulates real Platform Admin behavior strictly over public HTTP.
 * - Authenticates via POST /api/auth/login using ADMIN_EMAIL & ADMIN_PASSWORD.
 * - Seeds Categories via POST /api/taxonomy/categories
 * - Seeds Vibes via POST /api/taxonomy/vibes
 * - ZERO direct database or Prisma access: 100% environment parity (local dev & remote VPS).
 *
 * Usage:
 *   node seeding_scripts/00_taxonomy_flow/bot.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const config = require('../shared/config');
const { HttpClient } = require('../shared/http');
const { deleteCacheKey } = require('../shared/redis');

const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');

function loadQueue() {
  if (!fs.existsSync(INPUT_PATH)) {
    if (!fs.existsSync(REFERENCE_PATH)) {
      throw new Error(`Master reference file missing at ${REFERENCE_PATH}`);
    }
    const refData = fs.readFileSync(REFERENCE_PATH, 'utf8');
    fs.writeFileSync(INPUT_PATH, refData);
    console.log('📋 Initialized data_input.json from master data_reference.json');
  }

  try {
    const raw = fs.readFileSync(INPUT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${INPUT_PATH}: ${err.message}`);
  }
}

function saveQueue(data) {
  fs.writeFileSync(INPUT_PATH, JSON.stringify(data, null, 2));
}

async function seedTaxonomy() {
  console.log('🌱 FLOW 00: Seeding Taxonomy (Categories & Vibes) via Pure HTTP REST Ingress...');
  console.log(`   Ingress Target: [${config.targetEnv.toUpperCase()}] ${config.apiUrl}`);

  const adminEmail = config.adminEmail || process.env.ADMIN_EMAIL;
  const adminPassword = config.adminPassword || process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD.\n' +
      '   Please configure them in seeding_scripts/.env to match the Auth service bootstrap admin.'
    );
  }

  const queue = loadQueue();
  let categories = queue.categories || [];
  let vibes = queue.vibes || [];

  if (categories.length === 0 && vibes.length === 0) {
    console.log('✨ All taxonomy records are already seeded! (data_input.json queue empty)');
    console.log('💡 To re-seed, run: node seeding_scripts/00_taxonomy_flow/reset.js\n');
    return;
  }

  // 1. Authenticate as Platform Admin via Public HTTP Ingress
  console.log(`🔐 Authenticating as Platform Admin (${adminEmail})...`);
  const adminClient = new HttpClient(config.apiUrl);
  const loginRes = await adminClient.post('/auth/login', {
    email: adminEmail,
    password: adminPassword,
  });

  if (!loginRes.ok) {
    throw new Error(
      `❌ Admin authentication failed (HTTP ${loginRes.status}): ${JSON.stringify(loginRes.data || loginRes.rawBody)}\n` +
      '   Ensure the Auth service is running and bootstrap admin credentials are valid.'
    );
  }

  console.log('   ✓ Admin authenticated successfully.');

  // 2. Seed Categories via POST /api/taxonomy/categories
  let catSuccessCount = 0;
  const remainingCategories = [];

  for (const cat of categories) {
    try {
      const res = await adminClient.post('/taxonomy/categories', {
        name: cat.name,
        slug: cat.slug,
        emoji: cat.emoji,
      }, { maxRetries: 0 });

      const isSeededOrExists =
        res.ok ||
        res.status === 201 ||
        res.status === 200 ||
        res.status === 409 ||
        (res.data?.error && String(res.data.error).includes('Unique constraint'));

      if (isSeededOrExists) {
        catSuccessCount++;
      } else {
        console.error(`   ❌ Failed to seed category "${cat.name}" (HTTP ${res.status}):`, res.data?.error || res.rawBody);
        remainingCategories.push(cat);
      }
    } catch (err) {
      if (err.message?.includes('Unique constraint')) {
        catSuccessCount++;
      } else {
        console.error(`   ❌ Failed to seed category "${cat.name}":`, err.message);
        remainingCategories.push(cat);
      }
    }
  }

  queue.categories = remainingCategories;
  saveQueue(queue);

  if (catSuccessCount > 0) {
    console.log(`   ✅ Categories — verified/seeded ${catSuccessCount} records over HTTP`);
  }

  // 3. Seed Vibes via POST /api/taxonomy/vibes
  let vibeSuccessCount = 0;
  const remainingVibes = [];

  for (const vibe of vibes) {
    try {
      const res = await adminClient.post('/taxonomy/vibes', {
        key: vibe.key,
        label: vibe.label,
      }, { maxRetries: 0 });

      const isSeededOrExists =
        res.ok ||
        res.status === 201 ||
        res.status === 200 ||
        res.status === 409 ||
        (res.data?.error && String(res.data.error).includes('Unique constraint'));

      if (isSeededOrExists) {
        vibeSuccessCount++;
      } else {
        console.error(`   ❌ Failed to seed vibe "${vibe.label}" (HTTP ${res.status}):`, res.data?.error || res.rawBody);
        remainingVibes.push(vibe);
      }
    } catch (err) {
      if (err.message?.includes('Unique constraint')) {
        vibeSuccessCount++;
      } else {
        console.error(`   ❌ Failed to seed vibe "${vibe.label}":`, err.message);
        remainingVibes.push(vibe);
      }
    }
  }

  queue.vibes = remainingVibes;
  saveQueue(queue);

  if (vibeSuccessCount > 0) {
    console.log(`   ✅ Vibes — seeded/updated ${vibeSuccessCount} records over HTTP`);
  }

  // Invalidate taxonomy Redis cache
  await deleteCacheKey('cache:tags:all');

  console.log('🎉 FLOW 00 Taxonomy completed via 100% Pure HTTP Ingress.\n');
}

seedTaxonomy().catch((err) => {
  console.error('\n❌ FLOW 00 Seeding Failed:', err.message);
  process.exit(1);
});
