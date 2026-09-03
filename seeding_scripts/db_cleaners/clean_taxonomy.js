/**
 * DB Cleaner — Taxonomy (Categories, Vibes, Tags)
 * ==========================================================
 * Deletes all Categories, Vibes, and Tags.
 * PostTags (junction) must be cleaned first.
 *
 * Usage:
 *   node seeding_scripts/db_cleaners/clean_taxonomy.js
 *   node seeding_scripts/db_cleaners/clean_taxonomy.js --confirm
 * ==========================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const confirmed = process.argv.includes('--confirm');

async function cleanTaxonomy() {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will DELETE all Categories, Vibes, and Tags.\n');
    console.log('   Re-run with --confirm to proceed:\n');
    console.log('   node seeding_scripts/db_cleaners/clean_taxonomy.js --confirm\n');
    return;
  }

  console.log('🧹 Cleaning: Taxonomy (Categories, Vibes, Tags)...\n');

  const steps = [
    ['PostTag',   () => prisma.postTag.deleteMany({})],
    ['Tag',       () => prisma.tag.deleteMany({})],
    ['Category',  () => prisma.category.deleteMany({})],
    ['Vibe',      () => prisma.vibe.deleteMany({})],
  ];

  for (const [label, fn] of steps) {
    try {
      const r = await fn();
      console.log(`   ✅ ${label.padEnd(16)} — deleted ${r.count} row(s)`);
    } catch (e) {
      console.error(`   ❌ ${label.padEnd(16)} — ${e.message}`);
    }
  }

  console.log('\n✅ Taxonomy clean complete.\n');
}

cleanTaxonomy()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
