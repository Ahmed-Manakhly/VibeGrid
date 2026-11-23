/**
 * VibeGrid Seeding Orchestrator
 * ==========================================================
 * Executes canonical standalone HTTP seeding flows in order:
 *   Flow 00 — Taxonomy (Independent / Optional)
 *   Flow 01 — Auth & Profiles
 *   Flow 02 — Posts & Media
 *   Flow 03 — Social Graph (Follows)
 *   Flow 04 — Engagement (Likes, Comments)
 *   Flow 05 — Notifications Verification
 *
 * Commands:
 *   node seeding_scripts/run_all.js           — Run standard HTTP seeding (Flows 01–05)
 *   node seeding_scripts/run_all.js all       — Run all flows including Flow 00 Taxonomy
 *   node seeding_scripts/run_all.js reset     — Reset flows (reverse order)
 *   node seeding_scripts/run_all.js 01 02     — Run specific flows
 * ==========================================================
 */

const { execSync } = require('child_process');
const path = require('path');
const config = require('./shared/config');

const BASE = path.join(__dirname);

const FLOWS = [
  { id: '00', name: 'Taxonomy (Categories, Vibes)',                      bot: '00_taxonomy_flow/bot.js',        reset: '00_taxonomy_flow/reset.js',        independent: true },
  { id: '01', name: 'Auth, Profiles & Topic Interests',                  bot: '01_auth_profile_flow/bot.js',     reset: '01_auth_profile_flow/reset.js',     independent: false },
  { id: '06', name: 'Developer Communities & Guilds',                    bot: '06_communities_flow/bot.js',      reset: '06_communities_flow/reset.js',      independent: false },
  { id: '02', name: 'Rich Posts, Polls, Code & Q&A Discussions',        bot: '02_posts_media_flow/bot.js',      reset: '02_posts_media_flow/reset.js',      independent: false },
  { id: '03', name: 'Dense Social Graph (Follows)',                     bot: '03_social_graph_flow/bot.js',     reset: '03_social_graph_flow/reset.js',     independent: false },
  { id: '04', name: 'Engagement (Likes, Replies, Dilemma Votes, Q&A)',  bot: '04_engagement_flow/bot.js',      reset: '04_engagement_flow/reset.js',      independent: false },
  { id: '05', name: 'Social Signals (Bookmarks) & Notifications',        bot: '05_notifications_flow/bot.js',   reset: '05_notifications_flow/reset.js',   independent: false },
  { id: '07', name: 'Direct Messaging & Conversations (1-on-1)',         bot: '07_messages_flow/bot.js',        reset: '07_messages_flow/reset.js',        independent: false },
];

const args = process.argv.slice(2);
const isReset = args.includes('reset');
const isIncludeAll = args.includes('all');
const requestedIds = args.filter((a) => /^\d{2}$/.test(a));

function run(scriptPath) {
  const full = path.join(BASE, scriptPath);
  try {
    execSync(`node "${full}"`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        API_URL: config.apiUrl,
        BFF_URL: config.apiUrl,
        SEED_ENV: config.targetEnv,
      },
    });
  } catch (err) {
    console.error(`\n❌ Step failed: ${scriptPath}`);
    process.exit(1);
  }
}

let targetFlows;
if (requestedIds.length > 0) {
  targetFlows = FLOWS.filter((f) => requestedIds.includes(f.id));
} else if (isIncludeAll) {
  targetFlows = FLOWS;
} else {
  // Canonical default stream: 01 -> 02 -> 03 -> 04 -> 05
  targetFlows = FLOWS.filter((f) => !f.independent);
}

if (isReset) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Seeding — FULL RESET (Reverse Order)         ║');
  console.log(`║  Target: [${config.targetEnv.toUpperCase()}] ${config.apiUrl.padEnd(41)}║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  if (config.isProd) {
    console.log('💡 Note: Local reset.js scripts execute directly against local DB.');
    console.log('   To reset against the remote VPS, execute the flow remote scripts over SSH:');
    console.log('   e.g. bash seeding_scripts/01_auth_profile_flow/remote_reset.sh --confirm');
    console.log('   Or for full remote wipe: bash seeding_scripts/remote_clean_prod.sh --confirm\n');
  }
  const resetFlows = [...targetFlows].reverse();
  resetFlows.forEach((f, idx) => {
    console.log(`\n[${idx + 1}/${resetFlows.length}] 🔄 Resetting Flow ${f.id}: ${f.name}`);
    run(f.reset);
  });
  console.log('\n✅ All targeted flows reset.\n');
} else {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Standalone HTTP Seeding — Orchestration      ║');
  console.log(`║  Target: [${config.targetEnv.toUpperCase()}] ${config.apiUrl.padEnd(41)}║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  targetFlows.forEach((f, idx) => {
    console.log(`\n[${idx + 1}/${targetFlows.length}] 🚀 Flow ${f.id}: ${f.name}`);
    run(f.bot);
    console.log(`   --> [Flow ${f.id}] PASS`);
  });
  console.log(`\n${'═'.repeat(56)}`);
  console.log('🎉 Full Seeding Execution Succeeded!');
  console.log(`${'═'.repeat(56)}\n`);
}
