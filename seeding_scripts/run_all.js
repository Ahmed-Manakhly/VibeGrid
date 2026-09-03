/**
 * VibeGrid Seeding Orchestrator
 * ==========================================================
 * Runs all seeding flows in order.
 *
 * Commands:
 *   node seeding_scripts/run_all.js           — Run all flows in order
 *   node seeding_scripts/run_all.js reset     — Reset all flows (reverse order)
 *   node seeding_scripts/run_all.js 00        — Run only flow 00
 *   node seeding_scripts/run_all.js 01        — Run only flow 01
 *   node seeding_scripts/run_all.js 01 02     — Run specific flows
 * ==========================================================
 */

const { execSync } = require('child_process');
const path = require('path');

const BASE = path.join(__dirname);

const FLOWS = [
  { id: '00', name: 'Taxonomy (Categories, Vibes)', bot: '00_taxonomy_flow/bot.js',      reset: '00_taxonomy_flow/reset.js' },
  { id: '01', name: 'Auth & Profiles',              bot: '01_auth_profile_flow/bot.js',   reset: '01_auth_profile_flow/reset.js' },
  { id: '02', name: 'Social Graph (Follows)',       bot: '02_social_graph_flow/bot.js',   reset: '02_social_graph_flow/reset.js' },
  { id: '03', name: 'Content (Posts, Tags)',        bot: '03_content_flow/bot.js',        reset: '03_content_flow/reset.js' },
  { id: '04', name: 'Engagement (Likes, Comments)', bot: '04_engagement_flow/bot.js',    reset: '04_engagement_flow/reset.js' },
];

const args = process.argv.slice(2);
const isReset = args[0] === 'reset';
const requestedIds = args.filter(a => /^\d{2}b?$/.test(a));

function run(scriptPath) {
  const full = path.join(BASE, scriptPath);
  console.log(`\n${'═'.repeat(56)}`);
  try {
    execSync(`node "${full}"`, { stdio: 'inherit' });
  } catch {
    console.error(`\n❌ Script failed: ${scriptPath}`);
    process.exit(1);
  }
}

const targetFlows = requestedIds.length > 0
  ? FLOWS.filter(f => requestedIds.includes(f.id))
  : FLOWS;

if (isReset) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Seeding — FULL RESET (reverse order)         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  [...targetFlows].reverse().forEach(f => {
    console.log(`\n🔄 Resetting Flow ${f.id}: ${f.name}`);
    run(f.reset);
  });
  console.log('\n✅ All flows reset.\n');
} else {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Seeding — Full Run                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  targetFlows.forEach(f => {
    console.log(`\n🚀 Running Flow ${f.id}: ${f.name}`);
    run(f.bot);
  });
  console.log('\n🎉 All flows complete!\n');
}
