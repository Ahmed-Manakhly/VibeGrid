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

const path = require('path');
const fs = require('fs');

// Try loading .env from root or cwd if DATABASE_URL is not already set
if (!process.env.DATABASE_URL) {
  const candidateEnvPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try {
        require('dotenv').config({ path: envPath });
        break;
      } catch (e) {
        // dotenv not installed (e.g. production container)
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const Redis = require('ioredis');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL;

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

const confirmed = process.argv.includes('--confirm');
const includeAdmins = process.argv.includes('--include-admins');
const adminEmail = process.env.ADMIN_EMAIL || 'admin@vibegrid.manakhly.tech';

function ensureSchemaPushed() {
  try {
    console.log('🔄 PostgreSQL tables missing. Auto-syncing schema with Prisma...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    console.log('✅ PostgreSQL schema created successfully!\n');
  } catch (err) {
    console.error('❌ Failed to push Prisma schema:', err.message);
  }
}

async function cleanAll() {
  if (!confirmed) {
    console.log('⚠️  WARNING: This will DELETE ALL DATA from ALL tables (except Admin).\n');
    console.log('   Re-run with --confirm to proceed:\n');
    console.log('   node seeding_scripts/db_cleaners/clean_all.js --confirm\n');
    return;
  }

  console.log('🔥 FULL DB WIPE — starting (leaf tables first)...\n');

  const steps = [
    // 1. Direct Messaging
    ['DirectMessage',           () => prisma.directMessage.deleteMany({})],
    ['ConversationParticipant', () => prisma.conversationParticipant.deleteMany({})],
    ['Conversation',            () => prisma.conversation.deleteMany({})],
    // 2. Notifications, Bookmarks, Moderation
    ['Notifications',           () => prisma.notifications.deleteMany({})],
    ['Bookmark',                () => prisma.bookmark.deleteMany({})],
    ['UserBlock',               () => prisma.userBlock.deleteMany({})],
    ['UserReport',              () => prisma.userReport.deleteMany({})],
    ['DeveloperMilestone',      () => prisma.developerMilestone.deleteMany({})],
    ['OutboxEvent',             () => prisma.outboxEvent.deleteMany({})],
    // 3. Polls & Engagement
    ['PollVote',                () => prisma.pollVote.deleteMany({})],
    ['PollOption',              () => prisma.pollOption.deleteMany({})],
    ['Poll',                    () => prisma.poll.deleteMany({})],
    ['ReGrid',                  () => prisma.reGrid.deleteMany({})],
    ['CommentLike',             () => prisma.commentLike.deleteMany({})],
    ['Comment',                 () => prisma.comment.deleteMany({})],
    ['Like',                    () => prisma.like.deleteMany({})],
    // 4. Tags & Posts
    ['PostTag',                 () => prisma.postTag.deleteMany({})],
    ['TagFollow',               () => prisma.tagFollow.deleteMany({})],
    ['Tag',                     () => prisma.tag.deleteMany({})],
    ['Post',                    () => prisma.post.deleteMany({})],
    // 5. Communities
    ['CommunityMember',         () => prisma.communityMember.deleteMany({})],
    ['Community',               () => prisma.community.deleteMany({})],
    // 6. Social & Interests
    ['UserInterest',            () => prisma.userInterest.deleteMany({})],
    ['Follows',                 () => prisma.follows.deleteMany({})],
    // 7. Taxonomy (Leaf nodes now that Post and UserInterest are gone)
    ['Category',                () => prisma.category.deleteMany({})],
    ['Vibe',                    () => prisma.vibe.deleteMany({})],
    // 8. Users
    ['User',                    () => includeAdmins ? prisma.user.deleteMany({}) : prisma.user.deleteMany({ where: { email: { not: adminEmail } } })],
  ];

  for (const [label, fn] of steps) {
    try {
      const r = await fn();
      console.log(`   ✅ ${label.padEnd(20)} — deleted ${r.count} row(s)`);
    } catch (e) {
      if (e.message && e.message.includes('does not exist in the current database')) {
        ensureSchemaPushed();
        try {
          const retryRes = await fn();
          console.log(`   ✅ ${label.padEnd(20)} — deleted ${retryRes.count} row(s)`);
          continue;
        } catch (retryErr) {
          console.error(`   ❌ ${label.padEnd(20)} — ${retryErr.message}`);
          continue;
        }
      }
      console.error(`   ❌ ${label.padEnd(20)} — ${e.message}`);
    }
  }

  console.log(`\n🔥 Full wipe complete. ${includeAdmins ? 'ALL users deleted (including Admins).' : 'Admin account preserved.'}\n`);

  // Invalidate Redis cache & Next.js cache
  try {
    if (redisUrl) {
      const redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();
      await redis.flushdb();
      console.log('   🧹 Flushed all Redis cache keys (feed, taxonomy, recommendations, suggestions)');
      await redis.quit();
    }
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis cache flush skipped (${err.message})`);
  }

  console.log('   ➡️  Next: node seeding_scripts/00_taxonomy_flow/bot.js\n');
}

cleanAll()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
