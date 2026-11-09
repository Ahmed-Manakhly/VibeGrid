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

const BASE = path.join(__dirname);

const FLOWS = [
  { id: '00', name: 'Taxonomy (Categories, Vibes)', bot: '00_taxonomy_flow/bot.js',      reset: '00_taxonomy_flow/reset.js',      independent: true },
  { id: '01', name: 'Auth & Profiles',              bot: '01_auth_profile_flow/bot.js',   reset: '01_auth_profile_flow/reset.js',   independent: false },
  { id: '02', name: 'Posts & Media',                bot: '02_posts_media_flow/bot.js',    reset: '02_posts_media_flow/reset.js',    independent: false },
  { id: '03', name: 'Social Graph (Follows)',       bot: '03_social_graph_flow/bot.js',   reset: '03_social_graph_flow/reset.js',   independent: false },
  { id: '04', name: 'Engagement (Likes, Comments)', bot: '04_engagement_flow/bot.js',    reset: '04_engagement_flow/reset.js',    independent: false },
  { id: '05', name: 'Notifications Verification',   bot: '05_notifications_flow/bot.js',   reset: '05_notifications_flow/reset.js',   independent: false },
  { id: '06', name: 'Developer Communities Hub',    bot: '06_communities_flow/bot.js',     reset: '06_communities_flow/reset.js',     independent: false },
];

const args = process.argv.slice(2);
const isReset = args.includes('reset');
const isIncludeAll = args.includes('all');
const requestedIds = args.filter((a) => /^\d{2}$/.test(a));

function run(scriptPath) {
  const full = path.join(BASE, scriptPath);
  try {
    execSync(`node "${full}"`, { stdio: 'inherit' });
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
  console.log('╚════════════════════════════════════════════════════════╝');
  const resetFlows = [...targetFlows].reverse();
  resetFlows.forEach((f, idx) => {
    console.log(`\n[${idx + 1}/${resetFlows.length}] 🔄 Resetting Flow ${f.id}: ${f.name}`);
    run(f.reset);
  });
  console.log('\n✅ All targeted flows reset.\n');
} else {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Standalone HTTP Seeding — Orchestration      ║');
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
