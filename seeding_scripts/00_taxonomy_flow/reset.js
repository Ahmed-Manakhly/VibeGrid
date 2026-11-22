/**
 * FLOW 00 RESET — Taxonomy Reset
 * ============================================================
 * Wipes Categories, Vibes, Tags, PostTags
 * ============================================================
 */

const path = require('path');
const fs = require('fs');

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

// URL VAR FOR LOCAL (Host native / localhost)
// DATABASE_URL="postgresql://vibegrid:secret@localhost:5432/vibegrid_db?schema=public"
// URL VAR FOR PROD (Container network / VPS)
// DATABASE_URL="postgresql://vibegrid:secret@vibegrid_postgres:5432/vibegrid_db?schema=public"
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
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
  await prisma.tag.deleteMany({});
  const catR = await prisma.category.deleteMany({});
  const vibeR = await prisma.vibe.deleteMany({});

  console.log(`   ✅ Categories reset (${catR.count} deleted)`);
  console.log(`   ✅ Vibes reset (${vibeR.count} deleted)`);

  const path = require('path');
  const fs = require('fs');
  const INPUT_PATH = path.join(__dirname, 'data_input.json');
  const REFERENCE_PATH = path.join(__dirname, 'data_reference.json');

  if (fs.existsSync(REFERENCE_PATH)) {
    fs.copyFileSync(REFERENCE_PATH, INPUT_PATH);
    console.log('   📋 Reset data_input.json from master data_reference.json');
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
