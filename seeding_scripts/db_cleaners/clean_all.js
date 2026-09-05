/**
 * DB Cleaner — ALL TABLES (Full Wipe)
 * ==========================================================
 * ⚠️  DANGER: Deletes EVERYTHING except the ADMIN user.
 *
 * Deletion order: leaf nodes first, then parents.
 * Admin is preserved (role = ADMIN).
 *
 * Usage:
 *   node seeding_scripts/db_cleaners/clean_all.js
 *   node seeding_scripts/db_cleaners/clean_all.js --confirm
 * ==========================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const confirmed = process.argv.includes('--confirm');

async function cleanAll() {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will DELETE ALL DATA from ALL tables (except Admin).\n');
    console.log('   Re-run with --confirm to proceed:\n');
    console.log('   node seeding_scripts/db_cleaners/clean_all.js --confirm\n');
    return;
  }

  console.log('🔥 FULL DB WIPE — starting (leaf tables first)...\n');

  const steps = [
    // Leaf nodes (no outbound FKs to other tables)
    ['Notifications',  () => prisma.notifications.deleteMany({})],
    ['Like',           () => prisma.like.deleteMany({})],
    ['PostTag',        () => prisma.postTag.deleteMany({})],
    ['Comment',        () => prisma.comment.deleteMany({})],
    ['Post',           () => prisma.post.deleteMany({})],
    ['Follows',        () => prisma.follows.deleteMany({})],
    // Orphaned taxonomy leaf nodes
    ['Tag',            () => prisma.tag.deleteMany({})],
    ['Category',       () => prisma.category.deleteMany({})],
    ['Vibe',           () => prisma.vibe.deleteMany({})],
    // Users (Leaf-level entity that connects to everything else)
    ['User',           () => prisma.user.deleteMany({})],
  ];

  for (const [label, fn] of steps) {
    try {
      const r = await fn();
      console.log(`   ✅ ${label.padEnd(20)} — deleted ${r.count} row(s)`);
    } catch (e) {
      console.error(`   ❌ ${label.padEnd(20)} — ${e.message}`);
    }
  }

  console.log('\n🔥 Full wipe complete. Admin account preserved.\n');
  console.log('   ➡️  Next: node seeding_scripts/00_taxonomy_flow/bot.js\n');
}

cleanAll()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
