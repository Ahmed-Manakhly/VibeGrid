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

// URL VAR FOR LOCAL (Host native / localhost)
// DATABASE_URL="postgresql://vibegrid:secret@localhost:5432/vibegrid_db?schema=public"
// URL VAR FOR PROD (Container network / VPS)
// DATABASE_URL="postgresql://vibegrid:secret@vibegrid_postgres:5432/vibegrid_db?schema=public"
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
