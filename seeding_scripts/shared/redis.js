/**
 * Shared Redis Cache Helper for Seeding Scripts & Cleaners
 * ============================================================
 * Handles credential extraction, URL-decoding, and environment variable
 * interpolation for Redis in seeding bots, flow resets, and wipers.
 * ============================================================
 */

const path = require('path');
const fs = require('fs');
const Redis = require('ioredis');

// Ensure environment variables are loaded
const candidateEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    try { require('dotenv').config({ path: envPath }); } catch (e) {}
  }
}

function getRedisConfig() {
  const rawUrl = process.env.REDIS_URL;
  const rawPass = process.env.REDIS_PASSWORD;
  const decodedPassword = rawPass ? decodeURIComponent(rawPass) : undefined;

  let host = 'localhost';
  let port = 6379;
  let password = decodedPassword;

  if (rawUrl) {
    try {
      // If URL has unexpanded variable ${REDIS_PASSWORD}, replace it
      const sanitizedUrl = rawUrl.replace(/\$\{REDIS_PASSWORD\}/g, encodeURIComponent(decodedPassword || ''));
      const parsed = new URL(sanitizedUrl);
      host = parsed.hostname || 'localhost';
      port = parseInt(parsed.port || '6379', 10);
      if (!password && parsed.password) {
        password = decodeURIComponent(parsed.password);
      }
    } catch (e) {
      // Fallback to default
    }
  }

  return { host, port, password, lazyConnect: true, maxRetriesPerRequest: 1 };
}

function getRedisClient() {
  const config = getRedisConfig();
  return new Redis(config);
}

async function flushAllCache() {
  const client = getRedisClient();
  try {
    await client.connect();
    await client.flushdb();
    console.log('   🧹 Flushed all Redis cache keys (feed, taxonomy, recommendations, suggestions)');
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis flush skipped (${err.message})`);
  } finally {
    try { await client.quit(); } catch (e) {}
  }
}

async function deleteCacheKey(key) {
  const client = getRedisClient();
  try {
    await client.connect();
    const deleted = await client.del(key);
    if (deleted > 0) {
      console.log(`   🧹 Invalidated Redis cache key: "${key}"`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis key deletion skipped for "${key}" (${err.message})`);
  } finally {
    try { await client.quit(); } catch (e) {}
  }
}

async function deleteCachePattern(pattern) {
  const client = getRedisClient();
  try {
    await client.connect();
    const keys = await client.keys(pattern);
    if (keys && keys.length > 0) {
      await client.del(...keys);
      console.log(`   🧹 Invalidated ${keys.length} Redis cache keys matching "${pattern}"`);
    }
  } catch (err) {
    console.warn(`   ⚠️ Notice: Redis pattern deletion skipped for "${pattern}" (${err.message})`);
  } finally {
    try { await client.quit(); } catch (e) {}
  }
}

module.exports = {
  getRedisConfig,
  getRedisClient,
  flushAllCache,
  deleteCacheKey,
  deleteCachePattern,
};

