/**
 * RAW DATABASE WIPER — PostgreSQL & Redis (Bare Metal Nuclear Wipe)
 * ==============================================================================
 * ⚠️  DANGER / DISASTER RECOVERY:
 * This script is a RAW INFRASTRUCTURE CLEANER, NOT A SEEDING RESET.
 * It deletes ALL rows from ALL 27 PostgreSQL tables and flushes all Redis keys.
 * It wipes real human manual data as well as bot data.
 *
 * It is completely decoupled from data_input.json and data_reference.json.
 *
 * Usage:
 *   node seeding_scripts/raw_db_wipers/wipe_postgres_redis.js --confirm
 *   node seeding_scripts/raw_db_wipers/wipe_postgres_redis.js --confirm --include-admins
 * ==============================================================================
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

function getRedisConfig() {
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

  return { host, port, password, lazyConnect: true, maxRetriesPerRequest: 1 };
}

async function flushAllRedis() {
  try {
    const config = getRedisConfig();
    const redis = new Redis(config);
    await redis.connect();
    await redis.flushdb();
    console.log('   🧹 Flushed all Redis cache keys (feed, taxonomy, recommendations, suggestions)');
    await redis.quit();
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis cache flush skipped (${err.message})`);
  }
}

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

async function wipeRawDb() {
  if (!confirmed) {
    console.log('==============================================================================');
    console.log('⚠️  WARNING: NUCLEAR DATABASE WIPE (PostgreSQL & Redis)');
    console.log('   This will permanently TRUNCATE ALL 27 TABLES and FLUSH ALL CACHES.');
    console.log('   All real user accounts, posts, comments, and messages will be DESTROYED.');
    console.log('   Re-run with --confirm to proceed:');
    console.log('   node seeding_scripts/raw_db_wipers/wipe_postgres_redis.js --confirm');
    console.log('==============================================================================\n');
    return;
  }

  console.log('🔥 NUCLEAR POSTGRESQL & REDIS WIPE — starting (leaf tables first)...\n');

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
    // 7. Taxonomy
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

  console.log(`\n🔥 PostgreSQL wipe complete. ${includeAdmins ? 'ALL users deleted (including Admins).' : 'Admin account preserved.'}\n`);

  // Invalidate Redis cache
  await flushAllRedis();
}

wipeRawDb()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

