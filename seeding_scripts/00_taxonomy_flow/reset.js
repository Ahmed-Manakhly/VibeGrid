/**
 * FLOW 00 RESET — Taxonomy Reset
 * ============================================================
 * Wipes Categories, Vibes, Tags, PostTags
 * ============================================================
 */

const path = require('path');
const fs = require('fs');

// Try loading .env from root or cwd if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const candidateEnvPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'seeding_scripts/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try { require('dotenv').config({ path: envPath }); break; } catch (e) {}
    }
  }
}

const { PrismaClient } = require('@prisma/client');

function loadReferenceData() {
  if (process.env.SEED_REF_B64) {
    try {
      const decoded = Buffer.from(process.env.SEED_REF_B64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse SEED_REF_B64:', e.message);
    }
  }
  const candidatePaths = [
    path.join(__dirname, '..', 'data_reference.json'),
    path.join(__dirname, 'data_reference.json'),
    path.join(process.cwd(), 'seeding_scripts', 'data_reference.json'),
    path.join(process.cwd(), 'data_reference.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
    }
  }
  return {};
}

async function deleteTaxonomyCache() {
  try {
    const Redis = require('ioredis');
    const rawUrl = process.env.REDIS_URL;
    const rawPass = process.env.REDIS_PASSWORD;
    const decodedPassword = rawPass ? decodeURIComponent(rawPass) : undefined;

    let host = 'localhost';
    let port = 6379;
    let password = decodedPassword;

    if (rawUrl) {
      try {
        const sanitizedUrl = rawUrl.replace(/\$\{REDIS_PASSWORD\}/g, encodeURIComponent(decodedPassword || ''));
        const parsed = new URL(sanitizedUrl);
        host = parsed.hostname || 'localhost';
        port = parseInt(parsed.port || '6379', 10);
        if (!password && parsed.password) {
          password = decodeURIComponent(parsed.password);
        }
      } catch (e) {}
    }

    const redis = new Redis({ host, port, password, lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.connect();
    const deleted = await redis.del('cache:tags:all');
    if (deleted > 0) {
      console.log('   🧹 Invalidated Redis cache key: "cache:tags:all"');
    }
    await redis.quit();
  } catch (err) {
    // Non-blocking in case Redis is not reachable
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function resetTaxonomy() {
  console.log('🔄 FLOW 00 RESET: Cleaning Taxonomy...');

  await prisma.postTag.deleteMany({});
  await prisma.tagFollow.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.userInterest.deleteMany({});
  const catR = await prisma.category.deleteMany({});
  const vibeR = await prisma.vibe.deleteMany({});

  console.log(`   ✅ Categories reset (${catR.count} deleted)`);
  console.log(`   ✅ Vibes reset (${vibeR.count} deleted)`);

  const refData = loadReferenceData();
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');

  if (refData.categories && fs.existsSync(INPUT_PATH)) {
    try {
      const inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inputData.categories = JSON.parse(JSON.stringify(refData.categories || []));
      inputData.vibes = JSON.parse(JSON.stringify(refData.vibes || []));
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished categories & vibes in master data_input.json from reference data');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish data_input.json:', e.message);
    }
  }

  // Invalidate taxonomy Redis cache
  await deleteTaxonomyCache();

  console.log('✅ Flow 00 Reset complete.\n');
}

resetTaxonomy()
  .catch((e) => {
    console.error('❌ Flow 00 Reset failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
