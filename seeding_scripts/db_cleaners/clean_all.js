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
const { execSync } = require('child_process');
const Redis = require('ioredis');

// URL VAR FOR LOCAL (Host native / localhost)
// DATABASE_URL="postgresql://vibegrid:secret@localhost:5432/vibegrid_db?schema=public"
// REDIS_URL="redis://:secret@localhost:6379"
// URL VAR FOR PROD (Container network / VPS)
// DATABASE_URL="postgresql://vibegrid:secret@vibegrid_postgres:5432/vibegrid_db?schema=public"
// REDIS_URL="redis://:secret@vibegrid_redis:6379"
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const redisUrl = process.env.REDIS_URL;

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

const confirmed = process.argv.includes('--confirm');

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

  console.log('\n🔥 Full wipe complete. Admin account preserved.\n');

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
