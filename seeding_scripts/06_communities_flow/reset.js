const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetCommunities() {
  console.log('🔄 [Flow 06] Cleaning up seeded communities...');
  await prisma.communityMember.deleteMany({});
  await prisma.community.deleteMany({});
  console.log('✅ [Flow 06] Communities reset complete.');
}

resetCommunities()
  .catch((err) => {
    console.error('❌ Error resetting communities:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
