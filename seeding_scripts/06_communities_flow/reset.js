const path = require('path');
const fs = require('fs');

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

async function resetCommunities() {
  console.log('🔄 [Flow 06] Cleaning up seeded communities (targeted bot data only)...');

  const refData = loadReferenceData();
  const foundationalSlugs = [
    'nextjs-architects',
    'rust-systems',
    'devops-cloud-native',
    'ai-agents-mlops',
    'database-internals',
    'frontend-architects',
    'ai-engineers',
  ];
  let seedSlugs = [...foundationalSlugs];
  let refCommunities = [];
  if (Array.isArray(refData.communities)) {
    refCommunities = refData.communities;
    const refSlugs = refData.communities.map((c) => c.slug).filter(Boolean);
    seedSlugs = Array.from(new Set([...seedSlugs, ...refSlugs]));
  }

  const targetedGuilds = await prisma.community.findMany({
    where: { slug: { in: seedSlugs } },
    select: { id: true, slug: true },
  });

  const guildIds = targetedGuilds.map((g) => g.id);

  if (guildIds.length > 0) {
    const delMembers = await prisma.communityMember.deleteMany({
      where: { communityId: { in: guildIds } },
    });
    console.log(`   ✅ CommunityMember — deleted ${delMembers.count} row(s)`);

    await prisma.notifications.deleteMany({
      where: { communityId: { in: guildIds } },
    }).catch(() => {});

    const delGuilds = await prisma.community.deleteMany({
      where: { id: { in: guildIds } },
    });
    console.log(`   ✅ Community — deleted ${delGuilds.count} row(s)`);
  } else {
    console.log('   ℹ No seeded communities found in database.');
  }

  // Replenish communities slice in data_input.json if local files exist
  const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
  if (refCommunities.length > 0 && fs.existsSync(INPUT_PATH)) {
    try {
      const inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inputData.communities = refCommunities;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished communities in data_input.json from reference data.');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish communities in data_input.json:', e.message);
    }
  }

  console.log('✅ [Flow 06] Targeted communities reset complete.\n');
  await prisma.$disconnect();
}

resetCommunities()
  .catch((err) => {
    console.error('❌ Error resetting communities:', err);
    process.exit(1);
  });
