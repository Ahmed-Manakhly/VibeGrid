/**
 * FLOW 04 — Reset Script
 * ============================================================
 * Cleans up engagement references from session_state.json.
 *
 * Usage:
 *   node seeding_scripts/04_engagement_flow/reset.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

function resetFlow04() {
  console.log('🔄 Resetting Flow 04 (Engagement)...');

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.engagement;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.engagement;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared engagement session references.');
}

resetFlow04();
