const path = require('path');
const fs = require('fs');

// Try loading .env from root or cwd
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) { try { require('dotenv').config({ path: envPath }); break; } catch (e) {} }
}

const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

const REFERENCE_PATH = path.join(__dirname, '..', 'data_reference.json');
const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');

async function resetCommunities() {
  console.log('🔄 [Flow 06] Cleaning up seeded communities (targeted bot data only)...');

  let seedSlugs = ['nextjs-architects', 'rust-systems', 'devops-cloud-native', 'ai-agents-mlops', 'database-internals'];
  let refCommunities = [];
  if (fs.existsSync(REFERENCE_PATH)) {
    try {
      const refData = JSON.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
      if (Array.isArray(refData.communities)) {
        seedSlugs = refData.communities.map((c) => c.slug);
        refCommunities = refData.communities;
      }
    } catch (e) {}
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

    const delGuilds = await prisma.community.deleteMany({
      where: { id: { in: guildIds } },
    });
    console.log(`   ✅ Community — deleted ${delGuilds.count} row(s)`);
  } else {
    console.log('   ℹ No seeded communities found in database.');
  }

  // Replenish communities slice in data_input.json
  if (refCommunities.length > 0 && fs.existsSync(INPUT_PATH)) {
    try {
      const inputData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      inputData.communities = refCommunities;
      fs.writeFileSync(INPUT_PATH, JSON.stringify(inputData, null, 2));
      console.log('   📋 Replenished communities in data_input.json from data_reference.json');
    } catch (e) {
      console.warn('   ⚠️ Could not replenish communities in data_input.json:', e.message);
    }
  }

  console.log('✅ [Flow 06] Targeted communities reset complete.');
}

resetCommunities()
  .catch((err) => {
    console.error('❌ Error resetting communities:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
