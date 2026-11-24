/**
 * FLOW 01 RESET — Auth & Profile Reset
 * ============================================================
 * Safely removes only users and data seeded by Flow 01.
 * Preserves ADMIN user and system taxonomy.
 * Supports Base64 payload passing from host over container SSH execution.
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try loading .env from root or cwd if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const candidateEnvPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'seeding_scripts/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidateEnvPaths) {
    if (fs.existsSync(envPath)) {
      try { require('dotenv').config({ path: envPath }); break; } catch (e) {}
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function loadReferenceData() {
  if (process.env.SEED_REF_B64) {
    try {
      const decoded = Buffer.from(process.env.SEED_REF_B64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse SEED_REF_B64:', e.message);
    }
  }
  const candidatePaths = [
    path.join(__dirname, '..', 'data_reference.json'),
    path.join(__dirname, 'data_reference.json'),
    path.join(process.cwd(), 'seeding_scripts', 'data_reference.json'),
    path.join(process.cwd(), 'data_reference.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
    }
  }
  return {};
}

function loadSessionData() {
  if (process.env.SEED_SESS_B64) {
    try {
      const decoded = Buffer.from(process.env.SEED_SESS_B64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse SEED_SESS_B64:', e.message);
    }
  }
  const candidatePaths = [
    path.join(__dirname, '..', 'session_state.json'),
    path.join(__dirname, 'session_state.json'),
    path.join(process.cwd(), 'seeding_scripts', 'session_state.json'),
    path.join(process.cwd(), 'session_state.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
    }
  }
  return {};
}

async function resetAuthProfileFlow() {
  console.log('🔄 FLOW 01 RESET: Cleaning Auth & Profile seeded users...');

  const refData = loadReferenceData();
  const seedEmails = Array.isArray(refData.users) ? refData.users.map((u) => u.email).filter(Boolean) : [];

  if (seedEmails.length === 0) {
    console.log('   ⚠️ No seed user emails found in reference data. Skipping targeted reset.');
    return;
  }

  // 1. Remove from PostgreSQL
  const pgResult = await prisma.user.deleteMany({
    where: {
      email: { in: seedEmails },
      role: { not: 'ADMIN' },
    },
  });
  console.log(`   ✅ Deleted ${pgResult.count} seeded User profile(s) from PostgreSQL.`);

  // 2. Remove from Auth Service MongoDB (userauths & emailtokens)
  const mongoPass = process.env.MONGO_PASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD || '';
  const mongoUser = process.env.MONGO_USER || 'admin';
  const mongoAuthDb = process.env.MONGO_AUTH_DB || 'auth_db';
  const passArg = mongoPass ? `-p '${mongoPass}'` : '';

  for (const email of seedEmails) {
    try {
      const cmd1 = `docker exec -i $(docker ps -q -f name=mongo) mongosh -u ${mongoUser} ${passArg} --authenticationDatabase admin ${mongoAuthDb} --eval 'db.userauths.deleteMany({email: "${email}"})'`;
      const cmd2 = `docker exec -i $(docker ps -q -f name=mongo) mongosh -u ${mongoUser} ${passArg} --authenticationDatabase admin ${mongoAuthDb} --eval 'db.emailtokens.deleteMany({email: "${email}"})'`;
      execSync(cmd1, { stdio: 'ignore' });
      execSync(cmd2, { stdio: 'ignore' });
    } catch (e) {
      // Non-blocking in case Docker/MongoDB is not accessible in this execution context
    }
  }
  console.log(`   ✅ Cleaned seeded User auth credentials from MongoDB.`);

  // 3. Replenish users in input queue and reset session file (if local files exist)
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (fs.existsSync(INPUT_PATH) && Array.isArray(refData.users)) {
    try {
      const inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inputData.users = JSON.parse(JSON.stringify(refData.users));
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished users in master data_input.json from reference data.');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish users in data_input.json:', e.message);
    }
  }

  const SESSION_PATH = path.join(__dirname, 'session_state.json');
  const ROOT_SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
  if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
  if (fs.existsSync(ROOT_SESSION_PATH)) fs.unlinkSync(ROOT_SESSION_PATH);

  console.log('✅ FLOW 01 Reset complete.\n');
}

resetAuthProfileFlow()
  .catch((e) => {
    console.error('❌ FLOW 01 Reset failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
