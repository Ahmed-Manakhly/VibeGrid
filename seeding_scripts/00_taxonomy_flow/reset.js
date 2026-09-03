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
