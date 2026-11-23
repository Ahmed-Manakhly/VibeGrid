/**
 * Flow 06 — Developer Communities Seeding (Pure Standalone HTTP Ingress)
 * ============================================================
 * - Simulates real Admin / Creator creating developer guilds over public HTTP.
 * - Authenticates as Admin via POST /api/auth/login.
 * - Seeds Communities via POST /api/communities
 * - Auto-joins seeded users via POST /api/communities/[slug]/join
 * - Caches community metadata in session_state.json for downstream flows.
 * - ZERO direct database or Prisma access: 100% environment parity (local dev & remote VPS).
 *
 * Usage:
 *   node seeding_scripts/06_communities_flow/bot.js
 * ============================================================
 */

const path = require('path');
const fs = require('fs');
const config = require('../shared/config');
const { HttpClient } = require('../shared/http');

const FOUNDATIONAL_COMMUNITIES = [
  {
    slug: 'backend-guild',
    name: 'Backend Architecture Guild',
    description: 'High-throughput microservices, Clean Architecture, DDD, PostgreSQL concurrency, and API gateway engineering.',
    techTags: ['nodejs', 'postgresql', 'redis', 'clean-architecture', 'ddd'],
    rules: [
      'Share production profiling benchmarks and architecture RFCs.',
      'Constructive debate on domain boundaries.',
      'No flame wars.',
    ],
  },
  {
    slug: 'fullstack-collective',
    name: 'Full-Stack Collective',
    description: 'Modern full-stack systems: Next.js 14 App Router, Server Actions, TypeScript, React Server Components, and scalable state.',
    techTags: ['nextjs', 'react', 'typescript', 'server-actions', 'bff'],
    rules: [
      'Document trade-offs between SSR, RSC, and client components.',
      'Include reproducible snippets for technical questions.',
    ],
  },
  {
    slug: 'frontend-craft',
    name: 'Frontend Craft & Design',
    description: 'Design systems, atomic components, Tailwind CSS, accessibility, micro-animations, and fluid responsive layouts.',
    techTags: ['frontend', 'css', 'design-systems', 'tailwind', 'ui-ux'],
    rules: [
      'Show live demos or component links.',
      'Light/Dark mode parity required on featured styles.',
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
];

const INPUT_PATH = path.join(__dirname, '..', 'data_input.json');
const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');

function loadCommunities() {
  if (fs.existsSync(INPUT_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
      if (Array.isArray(data.communities) && data.communities.length > 0) {
        return data.communities;
      }
    } catch (e) {
      // Fallback
    }
  }
  return FOUNDATIONAL_COMMUNITIES;
}

function loadSession() {
  if (fs.existsSync(SESSION_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveSession(data) {
  fs.writeFileSync(SESSION_PATH, JSON.stringify(data, null, 2));
}

async function seedCommunities() {
  console.log('🏛️  FLOW 06: Seeding Communities & Guild Memberships via Pure HTTP REST Ingress...');
  console.log(`   Ingress Target: [${config.targetEnv.toUpperCase()}] ${config.apiUrl}`);

  const adminEmail = config.adminEmail || process.env.ADMIN_EMAIL;
  const adminPassword = config.adminPassword || process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in seeding_scripts/.env\n' +
      '   Communities creation requires authenticated creator/admin session.'
    );
  }

  // 1. Authenticate as Platform Admin / Creator via Public HTTP Ingress
  console.log(`🔐 Authenticating as Community Creator (${adminEmail})...`);
  const adminClient = new HttpClient(config.apiUrl);
  const loginRes = await adminClient.post('/auth/login', {
    email: adminEmail,
    password: adminPassword,
  });

  if (!loginRes.ok) {
    throw new Error(
      `❌ Creator authentication failed (HTTP ${loginRes.status}): ${JSON.stringify(loginRes.data || loginRes.rawBody)}\n` +
      '   Ensure the Auth service is running and bootstrap admin credentials are valid.'
    );
  }

  console.log('   ✓ Creator authenticated successfully.');

  const sessionData = loadSession();
  const communitiesToSeed = loadCommunities();
  const seededCommunities = {};

  // 2. Create Communities via POST /api/communities
  for (const item of communitiesToSeed) {
    try {
      const res = await adminClient.post('/communities', {
        name: item.name,
        slug: item.slug,
        description: item.description,
        techTags: item.techTags,
        rules: item.rules,
      });

      if (res.ok && res.data?.data) {
        const guild = res.data.data;
        seededCommunities[item.slug] = {
          id: guild.id,
          name: guild.name,
          slug: guild.slug,
        };
        console.log(`   ✅ Community created/verified: ${guild.name} (${guild.slug})`);
      } else {
        console.warn(`   ⚠️ Community creation note for "${item.name}":`, res.data?.error || res.rawBody);
      }
    } catch (err) {
      console.error(`   ❌ Failed to seed community "${item.name}":`, err.message);
    }
  }

  // 3. Auto-join seeded users to all communities via POST /api/communities/[slug]/join
  let rawData = {};
  if (fs.existsSync(INPUT_PATH)) {
    try {
      rawData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
    } catch (e) {}
  }
  const seedUsers = rawData.users || [];
  if (seedUsers.length > 0) {
    console.log(`\n👥 Auto-enrolling ${seedUsers.length} seed user(s) into communities via HTTP...`);

    // Authenticate each user to obtain session cookies
    const userClients = [];
    for (const u of seedUsers) {
      try {
        const uClient = new HttpClient(config.apiUrl);
        const uLogin = await uClient.post('/auth/login', {
          email: u.email,
          password: u.password,
        });
        if (uLogin.ok && (uLogin.data?.success || uLogin.data?.user)) {
          userClients.push({
            id: u.id,
            username: u.profile?.username || u.name,
            client: uClient,
          });
        } else {
          console.warn(`   ⚠️ Could not login user ${u.email}:`, uLogin.data?.error || uLogin.status);
        }
      } catch (logErr) {
        console.warn(`   ⚠️ User login error for ${u.email}:`, logErr.message);
      }
    }

    for (const [slug, guild] of Object.entries(seededCommunities)) {
      for (const { username, client } of userClients) {
        try {
          const joinRes = await client.post(`/communities/${slug}/join`);
          if (
            joinRes.ok ||
            joinRes.data?.success ||
            joinRes.data?.message?.includes('already a member') ||
            joinRes.data?.message?.includes('Already a member')
          ) {
            console.log(`   ✓ ${username} joined ${guild.name}`);
          } else {
            console.warn(`   ⚠️ ${username} join ${slug} response:`, joinRes.data);
          }
        } catch (joinErr) {
          // Non-fatal
        }
      }
    }
  }

  // 4. Update session state with community mappings
  sessionData.communities = seededCommunities;
  saveSession(sessionData);

  console.log('\n🎉 FLOW 06 Communities completed via 100% Pure HTTP Ingress.\n');
}

seedCommunities().catch((err) => {
  console.error('\n❌ FLOW 06 Seeding Failed:', err.message);
  process.exit(1);
});
