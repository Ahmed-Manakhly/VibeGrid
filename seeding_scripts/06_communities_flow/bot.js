/**
 * Flow 06 — Developer Communities Seeding
 * Seeds 5 foundational developer guilds with tags, rules, and initial memberships
 */

const { PrismaClient, CommunityRole } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function seedCommunities() {
  console.log('🌱 [Flow 06] Seeding foundational developer communities...');

  // 1. Get or create a seed admin creator user
  let creator = await prisma.user.findFirst();
  if (!creator) {
    console.log('   Creating fallback creator user for communities...');
    creator = await prisma.user.create({
      data: {
        email: 'creator@vibegrid.dev',
        username: 'guild_master',
        name: 'Guild Master',
        bio: 'Founding curator of VibeGrid developer communities.',
      },
    });
  }

  for (const item of FOUNDATIONAL_COMMUNITIES) {
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

  console.log('✅ [Flow 06] Developer communities seeded successfully!\n');
}

seedCommunities()
  .catch((err) => {
    console.error('❌ Error seeding communities:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
