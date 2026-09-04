/**
 * FLOW 03 — Reset Script
 * ============================================================
 * Cleans up social graph references from session_state.json.
 *
 * Usage:
 *   node seeding_scripts/03_social_graph_flow/reset.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '..', 'session_state.json');
const FLOW_SESSION_PATH = path.join(__dirname, 'session_state.json');

function resetFlow03() {
  console.log('🔄 Resetting Flow 03 (Social Graph)...');

  if (fs.existsSync(SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
    delete session.socialGraph;
    fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  }

  if (fs.existsSync(FLOW_SESSION_PATH)) {
    const session = JSON.parse(fs.readFileSync(FLOW_SESSION_PATH, 'utf8'));
    delete session.socialGraph;
    fs.writeFileSync(FLOW_SESSION_PATH, JSON.stringify(session, null, 2));
  }

  console.log('   ✓ Cleared social graph session references.');
}

resetFlow03();
