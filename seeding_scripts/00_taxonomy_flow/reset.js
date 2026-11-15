/**
 * FLOW 00 RESET — Taxonomy Reset
 * ============================================================
 * Wipes Categories, Vibes, Tags, PostTags
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
