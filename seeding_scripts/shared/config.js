/**
 * Shared Seeding Configuration & Dynamic Environment Loader
 * ============================================================
 * Resolves endpoints dynamically between LOCAL and PROD:
 * - Reads seeding_scripts/.env (git-ignored private config)
 * - Checks CLI argument: 'prod', '--prod', 'dev', 'local'
 * - Falls back to SEED_ENV or defaults to local
 * ============================================================
 */

const path = require('path');
const fs = require('fs');

// Try loading seeding_scripts/.env first, then root .env
const candidateEnvPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
  }
}

// Check command line arguments for environment override
const args = process.argv.slice(2);
let envOverride = null;
if (args.includes('prod') || args.includes('--prod') || args.includes('--env=prod')) {
  envOverride = 'prod';
} else if (
  args.includes('local') ||
  args.includes('dev') ||
  args.includes('--local') ||
  args.includes('--dev') ||
  args.includes('--env=local')
) {
  envOverride = 'local';
}

const targetEnv = (envOverride || process.env.SEED_ENV || 'local').toLowerCase();
const isProd = targetEnv === 'prod' || targetEnv === 'production';

// Ingress API URL priority:
// 1. Explicit environment variable (API_URL or BFF_URL)
// 2. PROD_API_URL if targetEnv is prod
// 3. LOCAL_API_URL if targetEnv is local
// 4. Default: http://localhost:3000/api
const apiUrl =
  process.env.API_URL ||
  process.env.BFF_URL ||
  (isProd ? process.env.PROD_API_URL : process.env.LOCAL_API_URL) ||
  'http://localhost:3000/api';

// Standard Project Database & Redis URLs (inherited from root .env for local operations)
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;

const vpsSshHost = process.env.VPS_SSH_HOST || process.env.VPS_HOST;

module.exports = {
  targetEnv: isProd ? 'prod' : 'local',
  isProd,
  apiUrl,
  databaseUrl,
  redisUrl,
  vpsSshHost,
};
