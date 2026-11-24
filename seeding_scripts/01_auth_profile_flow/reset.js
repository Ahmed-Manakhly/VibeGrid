/**
 * FLOW 01 RESET — Auth & Profile Reset
 * ============================================================
 * Safely removes only users and data seeded by Flow 01.
 * Preserves ADMIN user and taxonomy.
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');
const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const SESSION_PATH = path.join(__dirname, 'session_state.json');

async function resetAuthProfileFlow() {
  console.log('🔄 FLOW 01 RESET: Cleaning Auth & Profile seeded users...');

  if (!fs.existsSync(REFERENCE_PATH)) {
    console.log('   ⚠️  Reference file missing. Skipping targeted reset.');
    return;
  }

  const ref = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
  const seedEmails = (ref.users || []).map((u) => u.email);

  // 1. Remove from PostgreSQL
  const pgResult = await prisma.user.deleteMany({
    where: {
      email: { in: seedEmails },
      role: { not: 'ADMIN' },
    },
  });
  console.log(`   ✅ Deleted ${pgResult.count} seeded User profile(s) from PostgreSQL.`);

  // 2. Remove from Auth Service MongoDB (userauths & emailtokens)
  for (const email of seedEmails) {
    try {
      const cmd1 = `docker exec -i $(docker ps -q -f name=mongo) mongosh -u admin -p 'VgMongo_A2026#u7$YnR!3vTz' --authenticationDatabase admin auth_db --eval 'db.userauths.deleteMany({email: "${email}"})'`;
      const cmd2 = `docker exec -i $(docker ps -q -f name=mongo) mongosh -u admin -p 'VgMongo_A2026#u7$YnR!3vTz' --authenticationDatabase admin auth_db --eval 'db.emailtokens.deleteMany({email: "${email}"})'`;
      execSync(cmd1, { stdio: 'ignore' });
      execSync(cmd2, { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
  }
  console.log(`   ✅ Deleted seeded User auth credentials from MongoDB.`);

  // 3. Replenish users in input queue and reset session file
  if (fs.existsSync(REFERENCE_PATH) && fs.existsSync(INPUT_PATH)) {
    try {
      const refData = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      const inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inputData.users = JSON.parse(JSON.stringify(refData.users || []));
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished users in master data_input.json from data_reference.json');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish users in data_input.json:', e.message);
    }
  }
  if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
  const rootSession = path.join(__dirname, '..', 'session_state.json');
  if (fs.existsSync(rootSession)) fs.unlinkSync(rootSession);

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
