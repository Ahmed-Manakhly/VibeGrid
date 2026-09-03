/**
 * DB Cleaner — Users (+ all cascaded child records)
 * ==========================================================
 * Deletes all Users (except ADMIN) and all cascaded data:
 *   Posts, Comments, Likes, Follows, Notifications, PostTags,
 *   Tags (orphaned)
 *
 * Usage:
 *   node seeding_scripts/db_cleaners/clean_users.js
 *   node seeding_scripts/db_cleaners/clean_users.js --confirm
 * ==========================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const confirmed = process.argv.includes('--confirm');

async function cleanUsers() {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will DELETE ALL non-admin Users and all their data.\n');
    console.log('   Re-run with --confirm to proceed:\n');
    console.log('   node seeding_scripts/db_cleaners/clean_users.js --confirm\n');
    return;
  }

  console.log('🧹 Cleaning: Users + all cascaded child records...\n');

  const steps = [
    // Leaf nodes first (no FK children)
    ['Notifications',  () => prisma.notifications.deleteMany({})],
    ['Like',           () => prisma.like.deleteMany({})],
    ['PostTag',        () => prisma.postTag.deleteMany({})],
    ['Comment',        () => prisma.comment.deleteMany({})],
    ['Post',           () => prisma.post.deleteMany({})],
    ['Follows',        () => prisma.follows.deleteMany({})],
    // Now orphaned Tags (no posts referencing them)
    ['Tag (orphaned)', () => prisma.tag.deleteMany({})],
    // Finally users (preserve ADMIN)
    ['User',           () => prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } })],
  ];

  for (const [label, fn] of steps) {
    try {
      const r = await fn();
      console.log(`   ✅ ${label.padEnd(20)} — deleted ${r.count} row(s)`);
    } catch (e) {
      console.error(`   ❌ ${label.padEnd(20)} — ${e.message}`);
    }
  }

  console.log('\n✅ Users clean complete. Admin account preserved.\n');
}

cleanUsers()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
