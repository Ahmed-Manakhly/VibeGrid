/**
 * MASTER BOT SEEDING RESET — All Flows (Reverse Order)
 * ==============================================================================
 * 🎯 TARGETED BOT CLEANER (Preserves Manual UI Users & Real Data):
 * Executes each flow's targeted reset.js in reverse foreign key order:
 *   Flow 07 (Messages) -> Flow 05 (Notifications) -> Flow 04 (Engagement) ->
 *   Flow 03 (Social Graph) -> Flow 02 (Posts) -> Flow 06 (Communities) ->
 *   Flow 01 (Auth Personas) -> Flow 00 (Taxonomy)
 *
 * After cleaning bot data from the database, it automatically refills
 * master data_input.json from data_reference.json and cleans session state.
 *
 * Usage:
 *   node seeding_scripts/reset_all.js
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { flushAllCache } = require('./shared/redis');

const BASE_DIR = path.join(__dirname);
const REFERENCE_PATH = path.join(BASE_DIR, 'data_reference.json');
const INPUT_PATH = path.join(BASE_DIR, 'data_input.json');
const SESSION_PATH = path.join(BASE_DIR, 'session_state.json');

const FLOW_RESETS = [
  { id: '07', name: 'Direct Messaging & Conversations', script: '07_messages_flow/reset.js' },
  { id: '05', name: 'Social Signals & Notifications',   script: '05_notifications_flow/reset.js' },
  { id: '04', name: 'Engagement (Likes, Comments, Polls)', script: '04_engagement_flow/reset.js' },
  { id: '03', name: 'Dense Social Graph (Follows)',    script: '03_social_graph_flow/reset.js' },
  { id: '02', name: 'Posts, Media & Discussions',      script: '02_posts_media_flow/reset.js' },
  { id: '06', name: 'Developer Communities & Guilds',  script: '06_communities_flow/reset.js' },
  { id: '01', name: 'Auth Personas & Profiles',        script: '01_auth_profile_flow/reset.js' },
  { id: '00', name: 'System Taxonomy (Categories/Vibes)', script: '00_taxonomy_flow/reset.js' },
];

function runReset(scriptPath) {
  const full = path.join(BASE_DIR, scriptPath);
  if (!fs.existsSync(full)) {
    console.warn(`   ⚠️ Warning: Reset script not found at ${scriptPath}. Skipping.`);
    return;
  }
  try {
    execSync(`node "${full}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
  } catch (err) {
    console.error(`   ❌ Reset step failed: ${scriptPath} (${err.message})`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  VibeGrid Seeding — MASTER BOT RESET (Reverse Order)            ║');
  console.log('║  Targeted cleanup: Removes ONLY bot fixtures. Preserves UI data. ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  for (let i = 0; i < FLOW_RESETS.length; i++) {
    const f = FLOW_RESETS[i];
    console.log(`[${i + 1}/${FLOW_RESETS.length}] 🔄 Resetting Flow ${f.id}: ${f.name}...`);
    runReset(f.script);
  }

  // Replenish master data_input.json from master data_reference.json
  if (fs.existsSync(REFERENCE_PATH)) {
    fs.copyFileSync(REFERENCE_PATH, INPUT_PATH);
    console.log('\n📋 Master data_input.json replenished from data_reference.json');
  }

  // Remove session state
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log('🧹 Cleaned root session_state.json');
  }

  // Flush Redis cache
  await flushAllCache();

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('🎉 Master Bot Reset Complete! All bot data cleared, queue refilled.');
  console.log('══════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('❌ Master reset failed:', err);
  process.exit(1);
});

