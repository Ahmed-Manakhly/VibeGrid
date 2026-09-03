/**
 * DB Cleaner — Posts (Posts, Comments, Likes, Notifications, Tags)
 * ==========================================================
 * Deletes all Posts and all cascaded data.
 * Users are preserved.
 *
 * Usage:
 *   node seeding_scripts/db_cleaners/clean_posts.js
 *   node seeding_scripts/db_cleaners/clean_posts.js --confirm
 * ==========================================================
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const confirmed = process.argv.includes('--confirm');

async function cleanPosts() {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will DELETE all Posts and all associated Comments, Likes, Notifications, PostTags.\n');
    console.log('   Re-run with --confirm to proceed:\n');
    console.log('   node seeding_scripts/db_cleaners/clean_posts.js --confirm\n');
    return;
  }

  console.log('🧹 Cleaning: Posts + cascaded data...\n');

  const steps = [
    ['Notifications',  () => prisma.notifications.deleteMany({ where: { postId: { not: null } } })],
    ['Like',           () => prisma.like.deleteMany({})],
    ['PostTag',        () => prisma.postTag.deleteMany({})],
    ['Comment',        () => prisma.comment.deleteMany({})],
    ['Post',           () => prisma.post.deleteMany({})],
    ['Tag (orphaned)', () => prisma.tag.deleteMany({})],
  ];

  for (const [label, fn] of steps) {
    try {
      const r = await fn();
      console.log(`   ✅ ${label.padEnd(20)} — deleted ${r.count} row(s)`);
    } catch (e) {
      console.error(`   ❌ ${label.padEnd(20)} — ${e.message}`);
    }
  }

  console.log('\n✅ Posts clean complete. Users preserved.\n');
}

cleanPosts()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
