/**
 * Flow 06 — Developer Communities Seeding
 * Seeds 5 foundational developer guilds with tags, rules, and initial memberships
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

const { PrismaClient, CommunityRole } = require('@prisma/client');

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

const FOUNDATIONAL_COMMUNITIES = [
  {
    slug: 'frontend-architects',
    name: 'Frontend Architects',
    description: 'Discussions on macro frontend architecture, micro-frontends, rendering patterns, Next.js performance, and high-signal design systems.',
    techTags: ['react', 'nextjs', 'typescript', 'tailwind', 'architecture'],
    rules: [
      'Share production benchmarks and reproducible profiling traces.',
      'Constructive technical debates on component boundaries.',
      'No low-effort framework flame wars.',
    ],
  },
  {
    slug: 'ai-engineers',
    name: 'AI Engineers & Autonomous Agents',
    description: 'Building production LLM agents, evals, vector pipelines, RAG topologies, and autonomous coding assistant workflows.',
    techTags: ['ai', 'llm', 'agents', 'gemini', 'rag', 'typescript'],
    rules: [
      'Focus on real agent architectures, evals, and system prompts.',
      'Document token latency and cost trade-offs.',
      'Open source and reproducible workflows encouraged.',
    ],
  },
  {
    slug: 'rust-systems',
    name: 'Rust & Low-Level Systems',
    description: 'Memory safety, zero-cost abstractions, WebAssembly runtimes, high-throughput network engines, and kernel primitives.',
    techTags: ['rust', 'systems', 'wasm', 'performance', 'embedded'],
    rules: [
      'Focus on idiomatic Rust, zero-copy pipelines, and unsafe audit notes.',
      'Benchmarks must include compiler flags and target hardware.',
    ],
  },
  {
    slug: 'devops-cloud-native',
    name: 'DevOps & Cloud Native Tribe',
    description: 'Infrastructure as code, Kubernetes topologies, container networks, GitOps pipelines, and zero-downtime reliability engineering.',
    techTags: ['devops', 'kubernetes', 'docker', 'terraform', 'ci-cd'],
    rules: [
      'IaC configurations must follow immutable infrastructure principles.',
      'Incident retrospectives and resilience patterns welcomed.',
    ],
  },
  {
    slug: 'open-source-builders',
    name: 'Open Source Builders',
    description: 'Sharing open source releases, RFCs, governance models, maintainer playbooks, and collaborating on developer tools.',
    techTags: ['oss', 'github', 'maintainers', 'community', 'tools'],
    rules: [
      'Show your work: link repositories with active READMEs and licenses.',
      'Foster welcoming contributor onboarding.',
    ],
  },
];

const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');

function loadCommunities() {
  if (fs.existsSync(INPUT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      if (Array.isArray(data.communities) && data.communities.length > 0) {
        return data.communities;
      }
    } catch (_) {}
  }
  return FOUNDATIONAL_COMMUNITIES;
}

async function seedCommunities() {
  console.log('🌱 [Flow 06] Seeding foundational developer communities...');

  const communities = loadCommunities();

  // 1. Get or create a seed admin creator user
  const adminEmail = process.env.ADMIN_EMAIL;
  let creator = adminEmail ? await prisma.user.findUnique({ where: { email: adminEmail } }) : await prisma.user.findFirst();
  if (!creator) {
    creator = await prisma.user.findFirst();
  }
  if (!creator) {
    console.log('   Creating fallback creator user for communities...');
    creator = await prisma.user.create({
      data: {
        email: adminEmail || 'admin@vibegrid.manakhly.tech',
        username: 'guild_master',
        name: 'Guild Master',
        bio: 'Founding curator of VibeGrid developer communities.',
      },
    });
  }

  for (const item of communities) {
    const community = await prisma.community.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        techTags: item.techTags,
        rules: item.rules,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        techTags: item.techTags,
        rules: item.rules,
        creatorId: creator.id,
      },
    });

    // Ensure creator is ADMIN member
    await prisma.communityMember.upsert({
      where: {
        userId_communityId: {
          userId: creator.id,
          communityId: community.id,
        },
      },
      update: {
        role: CommunityRole.ADMIN,
      },
      create: {
        userId: creator.id,
        communityId: community.id,
        role: CommunityRole.ADMIN,
      },
    });

    console.log(`   --> Guild ready: /c/${community.slug} (${community.name})`);
  }

  // Save communities to session_state.json so downstream flows can scope posts to them
  const sessionPath = path.join(__dirname, '..', 'session_state.json');
  let sessionData = {};
  if (fs.existsSync(sessionPath)) {
    try {
      sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    } catch (_) {}
  }

  sessionData.communities = sessionData.communities || {};
  const dbCommunities = await prisma.community.findMany();
  for (const c of dbCommunities) {
    sessionData.communities[c.slug] = {
      id: c.id,
      slug: c.slug,
      name: c.name,
    };
  }

  // Ensure all registered seed users join communities as members
  const seedUserKeys = Object.keys(sessionData).filter((k) => sessionData[k]?.userId);
  for (const uKey of seedUserKeys) {
    const uId = sessionData[uKey].userId;
    for (const c of dbCommunities) {
      await prisma.communityMember.upsert({
        where: {
          userId_communityId: {
            userId: uId,
            communityId: c.id,
          },
        },
        update: {},
        create: {
          userId: uId,
          communityId: c.id,
          role: CommunityRole.MEMBER,
        },
      });
    }
  }

  fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));

  console.log('✅ [Flow 06] Developer communities seeded successfully & members enrolled!\n');
}

seedCommunities()
  .catch((err) => {
    console.error('❌ Error seeding communities:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
