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
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try { require('dotenv').config({ path: envPath }); break; } catch (e) {}
    }
  }
}

const { PrismaClient } = require('@prisma/client');

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

  const path = require('path');
  const fs = require('fs');
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');

  if (fs.existsSync(REFERENCE_PATH)) {
    try {
      const refData = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      let inputData = {};
      if (fs.existsSync(INPUT_PATH)) {
        inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      }
      inputData.categories = JSON.parse(JSON.stringify(refData.categories || []));
      inputData.vibes = JSON.parse(JSON.stringify(refData.vibes || []));
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished categories & vibes in master data_input.json from data_reference.json');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish data_input.json:', e.message);
    }
  }

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
