/**
 * FLOW 00 — Taxonomy & Categories Bot (Standard Millensys Pattern)
 * ============================================================
 * - Reference: data_reference.json (Master immutable reference)
 * - Working queue: data_input.json (Auto-created if missing)
 * - Idempotency: Successfully seeded records are removed from data_input.json
 * - Cache invalidation: Flushes Redis taxonomy cache upon completion
 *
 * Usage:
 *   node seeding_scripts/00_taxonomy_flow/bot.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

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
const Redis = require('ioredis');

// URL VAR FOR LOCAL (Host native / localhost)
// DATABASE_URL="postgresql://vibegrid:secret@localhost:5432/vibegrid_db?schema=public"
// REDIS_URL="redis://:secret@localhost:6379"
// URL VAR FOR PROD (Container network / VPS)
// DATABASE_URL="postgresql://vibegrid:secret@vibegrid_postgres:5432/vibegrid_db?schema=public"
// REDIS_URL="redis://:secret@vibegrid_redis:6379"
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL;

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');
const INPUT_PATH = path.join(__dirname, 'data_input.json');

function loadQueue() {
  if (!fs.existsSync(INPUT_PATH)) {
    if (!fs.existsSync(REFERENCE_PATH)) {
      throw new Error(`Master reference file missing at ${REFERENCE_PATH}`);
    }
    const refData = fs.readFileSync(REFERENCE_PATH, 'utf8');
    fs.writeFileSync(INPUT_PATH, refData);
    console.log('📋 Initialized data_input.json from data_reference.json');
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

async function invalidateTaxonomyCache() {
  if (!redisUrl) {
    console.warn('   ⚠️ Notice: REDIS_URL not set in .env. Skipping Redis cache flush.');
    return;
  }
  let redis = null;
  try {
    redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.connect();
    
    // Invalidate taxonomy and feed filters cache keys
    const keys = await redis.keys('cache:tags:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    await redis.del('cache:tags:all');
    console.log('   🧹 Flushed Redis taxonomy cache keys');
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis cache invalidation skipped (${err.message})`);
  } finally {
    if (redis) {
      redis.disconnect();
    }
  }
}

async function seedTaxonomy() {
  console.log('🌱 FLOW 00: Seeding Taxonomy (Categories & Vibes)...');

  const queue = loadQueue();
  const categories = queue.categories || [];
  const vibes = queue.vibes || [];

  if (categories.length === 0 && vibes.length === 0) {
    console.log('✨ All taxonomy records are already seeded! (data_input.json is empty)');
    console.log('💡 To re-seed, run: node seeding_scripts/00_taxonomy_flow/reset.js\n');
    return;
  }

  // 1. Seed Categories (Process and remove completed items)
  let catSuccessCount = 0;
  const remainingCategories = [];

  for (const cat of categories) {
    try {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat,
      });
      catSuccessCount++;
    } catch (err) {
      console.error(`   ❌ Failed to seed category "${cat.name}":`, err.message);
      remainingCategories.push(cat);
    }
  }
  queue.categories = remainingCategories;
  saveQueue(queue);

  if (catSuccessCount > 0) {
    console.log(`   ✅ Categories — seeded/updated ${catSuccessCount} records`);
  }

  // 2. Seed Vibes (Process and remove completed items)
  let vibeSuccessCount = 0;
  const remainingVibes = [];

  for (const vibe of vibes) {
    try {
      await prisma.vibe.upsert({
        where: { key: vibe.key },
        update: vibe,
        create: vibe,
      });
      vibeSuccessCount++;
    } catch (err) {
      console.error(`   ❌ Failed to seed vibe "${vibe.key}":`, err.message);
      remainingVibes.push(vibe);
    }
  }
  queue.vibes = remainingVibes;
  saveQueue(queue);

  if (vibeSuccessCount > 0) {
    console.log(`   ✅ Vibes — seeded/updated ${vibeSuccessCount} records`);
  }

  // 3. Invalidate Redis Cache
  await invalidateTaxonomyCache();

  if (remainingCategories.length === 0 && remainingVibes.length === 0) {
    console.log('🎉 Flow 00: Taxonomy seeding complete! data_input.json cleared.\n');
  } else {
    console.log(`⚠️ Flow 00: Completed with ${remainingCategories.length} categories and ${remainingVibes.length} vibes remaining in data_input.json.\n`);
  }
}

seedTaxonomy()
  .catch((e) => {
    console.error('❌ Flow 00 failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
